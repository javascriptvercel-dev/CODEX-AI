import { deflateRawSync } from "node:zlib";
import path from "node:path";
import { readdir, readFile } from "node:fs/promises";

export const runtime = "nodejs";

const TEMPLATE_DIR = path.resolve(process.cwd(), "templates", "bot-base-generator");
const ARCHIVE_ROOT = "whatsapp-bot";
const REQUIRED_FILES = ["README.md", "package.json", "index.js", "config.js"];
const IGNORED_NAMES = new Set([".git", "node_modules", "session"]);
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}

function validateText(value, label, maxLength) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(`${label} must be between 1 and ${maxLength} characters.`);
  }
  return value.trim();
}

function validateNumber(value, label, optional = false) {
  if (optional && value === "") return "";
  if (typeof value !== "string" || !/^\d{7,15}$/.test(value)) {
    throw new Error(`${label} must contain 7–15 digits, with no spaces or symbols.`);
  }
  return value;
}

function readConfig(body) {
  const botName = validateText(body.botName, "Bot name", 50);
  const prefix = validateText(body.prefix, "Command prefix", 4);
  if (/\s/.test(prefix)) {
    throw new Error("Command prefix must not contain spaces.");
  }

  return {
    botName,
    prefix,
    ownerName: validateText(body.ownerName, "Owner name", 50),
    ownerNumber: validateNumber(body.ownerNumber, "Owner number"),
    pairingNumber: validateNumber(body.pairingNumber, "Pairing number", true),
  };
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  return {
    date:
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
  };
}

function zipFiles(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const compressed = deflateRawSync(file.data);
    const checksum = crc32(file.data);
    const { date, time } = dosDateTime(file.modifiedAt);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

async function collectTemplateFiles(directory, relativeDirectory = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (IGNORED_NAMES.has(entry.name)) continue;
    const relativePath = path.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTemplateFiles(absolutePath, relativePath)));
    } else if (entry.isFile()) {
      files.push({
        name: `${ARCHIVE_ROOT}/${relativePath.split(path.sep).join("/")}`,
        data: await readFile(absolutePath),
        modifiedAt: new Date(),
      });
    }
  }

  return files;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Request body must contain the bot settings.", 400);
  }

  let config;
  try {
    config = readConfig(body);
  } catch (error) {
    return jsonError(error.message, 400);
  }

  try {
    const files = await collectTemplateFiles(TEMPLATE_DIR);
    const missingFiles = REQUIRED_FILES.filter(
      (required) => !files.some((file) => file.name === `${ARCHIVE_ROOT}/${required}`),
    );
    if (missingFiles.length) {
      console.error("[bot-base-generator] template is missing required files:", missingFiles);
      return jsonError("The bot template is incomplete and can't be packaged.", 500);
    }

    const configFile = files.find((file) => file.name === `${ARCHIVE_ROOT}/config.js`);
    configFile.data = Buffer.from(`export default ${JSON.stringify(config, null, 2)}\n`);
    const archive = zipFiles(files);

    return new Response(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="whatsapp-bot-base.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[bot-base-generator] failed to package template:", error);
    return jsonError("The bot base couldn't be generated. Please try again later.", 500);
  }
}
