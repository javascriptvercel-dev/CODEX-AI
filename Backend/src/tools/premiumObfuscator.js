import { createWriteStream } from "node:fs";
import { open } from "node:fs/promises";
import { Worker } from "node:worker_threads";
import { TextDecoder } from "node:util";
import yauzl from "yauzl";
import yazl from "yazl";
import { obfuscateJavaScript, OBFUSCATION_MODES } from "./javascriptObfuscator.js";

const MAX_ARCHIVE_FILES = 1_000;
const MAX_EXPANDED_BYTES = 100 * 1024 * 1024;
const MAX_JAVASCRIPT_BYTES = 2 * 1024 * 1024;
const MAX_OBFUSCATED_JS_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 200 * 1024 * 1024;
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

export class PremiumUploadError extends Error {}

function readZip(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(
      filePath,
      {
        lazyEntries: true,
        autoClose: false,
        decodeStrings: true,
        strictFileNames: true,
        validateEntrySizes: true,
      },
      (error, zipFile) => {
        if (error) return reject(error);
        resolve(zipFile);
      },
    );
  });
}

function obfuscateInWorker(source, mode) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./premiumObfuscator.worker.js", import.meta.url), {
      workerData: { source, mode },
      execArgv: [],
      resourceLimits: { maxOldGenerationSizeMb: 512, maxYoungGenerationSizeMb: 64 },
    });
    let settled = false;
    const timeout = setTimeout(() => {
      settled = true;
      void worker.terminate();
      reject(new Error("JavaScript obfuscation exceeded the 30-second per-file limit."));
    }, 30_000);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };
    worker.once("message", (result) => {
      if (result.error) finish(reject, new Error(result.error));
      else finish(resolve, result.code);
    });
    worker.once("error", (error) => finish(reject, error));
    worker.once("exit", (code) => {
      if (code !== 0) finish(reject, new Error(`JavaScript worker exited with code ${code}.`));
    });
  });
}

function readEntry(zipFile, entry) {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error) return reject(error);
      const chunks = [];
      let total = 0;
      stream.on("data", (chunk) => {
        total += chunk.length;
        if (total > MAX_EXPANDED_BYTES) {
          stream.destroy(new Error("ZIP expanded data exceeds the 100 MB limit."));
          return;
        }
        chunks.push(chunk);
      });
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks, total)));
    });
  });
}

function validEntryPath(name) {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    !name.includes("\\") &&
    !name.includes(":") &&
    !name.includes("\0") &&
    !name.startsWith("/") &&
    !/^[A-Za-z]:/.test(name) &&
    !name.split("/").some((part, index, parts) =>
      part === ".." ||
      part === "." ||
      (!part && index !== parts.length - 1),
    )
  );
}

function zipToFile(entries, outputPath) {
  return new Promise((resolve, reject) => {
    const archive = new yazl.ZipFile();
    const output = createWriteStream(outputPath, { flags: "wx" });
    output.once("error", reject);
    output.once("finish", resolve);
    archive.outputStream.once("error", reject);
    archive.outputStream.pipe(output);
    for (const entry of entries) {
      if (entry.directory) archive.addEmptyDirectory(entry.name, { mode: entry.mode });
      else archive.addBuffer(entry.data, entry.name, { mode: entry.mode });
    }
    archive.end();
  });
}

async function obfuscateBuffer(buffer, mode, name) {
  if (buffer.length > MAX_JAVASCRIPT_BYTES) {
    throw new PremiumUploadError(`JavaScript file "${name}" exceeds the 2 MB per-file limit.`);
  }
  let source;
  try {
    source = utf8Decoder.decode(buffer);
  } catch {
    throw new PremiumUploadError(`JavaScript file "${name}" is not valid UTF-8.`);
  }
  const transformed = Buffer.from(await obfuscateInWorker(source, mode), "utf8");
  if (transformed.length > MAX_OBFUSCATED_JS_BYTES) {
    throw new PremiumUploadError(`Obfuscated JavaScript file "${name}" exceeds the 20 MB output limit.`);
  }
  return transformed;
}

export async function obfuscateUploadedFile(inputPath, outputPath, originalName, mode) {
  if (!Object.hasOwn(OBFUSCATION_MODES, mode)) {
    throw new PremiumUploadError("Choose Easy, Medium, or Hard obfuscation.");
  }
  const extension = originalName.toLowerCase().split(".").pop();
  if (extension === "js") {
    const source = await open(inputPath, "r");
    try {
      const stats = await source.stat();
      if (stats.size > MAX_JAVASCRIPT_BYTES) {
        throw new PremiumUploadError("JavaScript uploads are limited to 2 MB per file.");
      }
      const buffer = Buffer.alloc(stats.size);
      await source.read(buffer, 0, stats.size, 0);
      await source.close();
      const transformed = await obfuscateBuffer(buffer, mode, originalName);
      const output = await open(outputPath, "wx");
      try {
        await output.writeFile(transformed);
      } finally {
        await output.close();
      }
      return { outputName: `${originalName.slice(0, -3)}.obfuscated.js`, contentType: "text/javascript" };
    } finally {
      await source.close().catch(() => {});
    }
  }
  if (extension !== "zip") throw new PremiumUploadError("Upload a .js file or a .zip project.");

  let zipFile;
  try {
    zipFile = await readZip(inputPath);
  } catch {
    throw new PremiumUploadError("The ZIP archive is invalid or corrupted.");
  }
  const names = new Set();
  const outputEntries = [];
  let fileCount = 0;
  let expandedBytes = 0;
  let outputBytes = 0;
  try {
    const entriesPromise = new Promise((resolve, reject) => {
      zipFile.on("error", () => {
        reject(new PremiumUploadError("The ZIP archive is invalid or corrupted."));
      });
      zipFile.on("end", resolve);
      zipFile.on("entry", async (entry) => {
        try {
          fileCount += 1;
          if (fileCount > MAX_ARCHIVE_FILES) {
            throw new PremiumUploadError("ZIP projects may contain at most 1,000 files.");
          }
          const name = entry.fileName;
          if (!validEntryPath(name)) throw new PremiumUploadError("ZIP contains an unsafe file path.");
          const fileType = (entry.externalFileAttributes >>> 16) & 0o170000;
          if (fileType === 0o120000) throw new PremiumUploadError("ZIP projects cannot contain symbolic links.");
          const directory = name.endsWith("/");
          if (names.has(name)) throw new PremiumUploadError("ZIP contains duplicate file paths.");
          names.add(name);
          expandedBytes += entry.uncompressedSize;
          if (expandedBytes > MAX_EXPANDED_BYTES) {
            throw new PremiumUploadError("ZIP expanded data exceeds the 100 MB limit.");
          }
          if (directory) {
            outputEntries.push({
              name,
              mode: ((entry.externalFileAttributes >>> 16) & 0o777) || undefined,
              directory: true,
              data: Buffer.alloc(0),
            });
            zipFile.readEntry();
            return;
          }

          const data = await readEntry(zipFile, entry).catch(() => {
            throw new PremiumUploadError("The ZIP archive contains an invalid or corrupted file.");
          });
          const outputData = name.toLowerCase().endsWith(".js")
            ? await obfuscateBuffer(data, mode, name)
            : data;
          outputBytes += outputData.length;
          if (outputBytes > MAX_OUTPUT_BYTES) {
            throw new PremiumUploadError("Obfuscated project exceeds the 200 MB output limit.");
          }
          outputEntries.push({
            name,
            mode: ((entry.externalFileAttributes >>> 16) & 0o777) || undefined,
            data: outputData,
          });
          zipFile.readEntry();
        } catch (error) {
          reject(error);
          zipFile.close();
        }
      });
      zipFile.readEntry();
    });
    await entriesPromise;
  } finally {
    zipFile.close();
  }

  await zipToFile(outputEntries, outputPath);
  const output = await open(outputPath, "r");
  try {
    const { size } = await output.stat();
    if (size > 200 * 1024 * 1024) {
      throw new PremiumUploadError("Obfuscated ZIP exceeds the 200 MB download limit.");
    }
  } finally {
    await output.close();
  }
  return { outputName: `${originalName.slice(0, -4)}.obfuscated.zip`, contentType: "application/zip" };
}

export const premiumUploadLimits = {
  archiveBytes: 100 * 1024 * 1024,
  expandedBytes: MAX_EXPANDED_BYTES,
  javaScriptBytes: MAX_JAVASCRIPT_BYTES,
};
