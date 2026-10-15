import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  obfuscateUploadedFile,
  PremiumUploadError,
  premiumUploadLimits,
} from "../tools/premiumObfuscator.js";

export async function obfuscateUploadedProject(req, res) {
  if (!req.file) return res.status(400).json({ error: "Choose a JavaScript file or ZIP project to upload." });
  const outputPath = path.join(os.tmpdir(), `codex-obfuscated-${randomUUID()}.zip`);
  const isSingleJs = req.file.originalname.toLowerCase().endsWith(".js");
  const actualOutput = isSingleJs
    ? path.join(os.tmpdir(), `codex-obfuscated-${randomUUID()}.js`)
    : outputPath;

  try {
    const result = await obfuscateUploadedFile(
      req.file.path,
      actualOutput,
      path.basename(req.file.originalname),
      req.body?.mode,
    );
    const downloadName = result.outputName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 160);
    res.set({
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Cache-Control": "no-store",
    });
    const stream = createReadStream(actualOutput);
    stream.on("error", (error) => {
      console.error("[premium-upload] output streaming failed:", error);
      if (!res.headersSent) res.status(500).json({ error: "Could not download the obfuscated file." });
      else res.destroy(error);
    });
    stream.on("close", () => {
      void unlink(actualOutput).catch((error) => {
        if (error.code !== "ENOENT") console.error("[premium-upload] output cleanup failed:", error);
      });
    });
    return stream.pipe(res);
  } catch (error) {
    console.error("[premium-upload] obfuscation failed:", error);
    await unlink(actualOutput).catch((cleanupError) => {
      if (cleanupError.code !== "ENOENT") {
        console.error("[premium-upload] partial output cleanup failed:", cleanupError);
      }
    });
    const status = error instanceof PremiumUploadError ? 400 : 500;
    return res.status(status).json({
      error: status === 400 ? error.message : "The uploaded project couldn't be obfuscated.",
    });
  } finally {
    await unlink(req.file.path).catch((error) => {
      if (error.code !== "ENOENT") console.error("[premium-upload] upload cleanup failed:", error);
    });
  }
}

export { premiumUploadLimits };
