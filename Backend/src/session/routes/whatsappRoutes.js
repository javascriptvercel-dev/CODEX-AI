import { kordid } from "../lib/kordid.js";
import { Router } from "express";
import fs from "fs";
import path from "path";
import os from "os";
import pino from "pino";
import QRCode from "qrcode";
import axios from "axios";
import {
  useMultiFileAuthState,
  makeWASocket,
  delay,
  fetchLatestBaileysVersion,
} from "baileys";
import NodeCache from "node-cache";
const msgCache = new NodeCache();
const sessCache = new NodeCache({ stdTTL: 600 });
const sessions = new Map();
const THUMB_URL =
  "https://cdn.crysnovax.link/files/1782641945104-66399a32-3e86-4e1f-9a13-32c3b4031dd4.jpeg";
let cachedThumbBuffer = null;
async function getThumbBuffer() {
  if (cachedThumbBuffer) return cachedThumbBuffer;
  try {
    const res = await axios.get(THUMB_URL, { responseType: "arraybuffer" });
    cachedThumbBuffer = Buffer.from(res.data);
  } catch (error) {
    console.warn(
      "Thumbnail fetch failed, view-channel card will render without it:",
      error.message,
    );
    cachedThumbBuffer = null;
  }
  return cachedThumbBuffer;
}
function getTempDir() {
  const tmp = process.env.VERCEL_TMP;
  return tmp && fs.existsSync(tmp) ? tmp : os.tmpdir();
}
function createSessDir(sessId) {
  const base = getTempDir();
  const dir = path.join(base, `kordai_${sessId}`);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}
async function cleanup(sessId) {
  try {
    const dir = path.join(getTempDir(), `kordai_${sessId}`);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    const sock = sessions.get(sessId);
    if (sock?.ev) {
      try {
        sock.ev.removeAllListeners();
      } catch (listenerError) {
        console.warn(
          `Listener cleanup warning for ${sessId}:`,
          listenerError?.message || listenerError,
        );
      }
    }
    if (sock?.ws && sock.ws.readyState === 1) {
      try {
        sock.ws.close();
      } catch (wsError) {
        console.warn(
          `Socket close warning for ${sessId}:`,
          wsError?.message || wsError,
        );
      }
    }
    sessions.delete(sessId);
    sessCache.del(sessId);
  } catch (error) {
    console.error(`Session cleanup error for ${sessId}:`, error);
  }
}
function sanitizeKey(key) {
  return key.replace(/[.#$\/\[\]]/g, "_");
}
function extractObjectId(payload) {
  return (
    payload?.storage?.name ||
    payload?.uploadResult?.name ||
    payload?.uploadResult?.objectId ||
    null
  );
}
async function collectSessionFiles(dir) {
  const files = {};
  const items = await fs.promises.readdir(dir);
  for (const item of items) {
    const filePath = path.join(dir, item);
    const stat = await fs.promises.stat(filePath);
    if (stat.isFile() && item.endsWith(".json")) {
      const content = await fs.promises.readFile(filePath, "utf8");
      try {
        const sanitizedKey = sanitizeKey(item);
        files[sanitizedKey] = {
          originalName: item,
          content: JSON.parse(content),
        };
      } catch (_parseError) {
        console.warn(`Skipping invalid JSON file: ${item}`);
      }
    }
  }
  if (Object.keys(files).length === 0) {
    throw new Error("No valid JSON files found in directory");
  }
  return files;
}
async function persistDir(sessionStore, dir, directoryId) {
  try {
    const files = await collectSessionFiles(dir);
    const payload = { directoryId, savedAt: new Date().toISOString(), files };
    const saved = await sessionStore.saveSession(directoryId, payload);
    return {
      directoryId,
      objectId: extractObjectId(saved),
      storage: saved?.storage || null,
      uploadResult: saved?.uploadResult || null,
    };
  } catch (error) {
    console.error("Directory upload error:", error);
    throw new Error(`Directory upload failed: ${error.message}`);
  }
}
async function fetchDir(sessionStore, dirId) {
  try {
    const data = await sessionStore.getSession(dirId);
    let presignedUrl = null;
    try {
      presignedUrl = await sessionStore.getPresignedUrl(dirId, 3600);
    } catch (urlError) {
      console.warn("Presigned URL generation skipped:", urlError.message);
    }
    return {
      directoryId: dirId,
      objectId: data?.storage?.name || null,
      url: presignedUrl,
      fileName: data?.storage?.name || `session-${dirId}.json`,
      data: data?.data || null,
      storage: data?.storage || null,
    };
  } catch (error) {
    console.error("Directory fetch error:", error);
    throw new Error(`Directory fetch failed: ${error.message}`);
  }
}
async function initWA(sessId, useQR = false) {
  const dir = createSessDir(sessId);
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA v${version.join(".")}, isLatest: ${isLatest}`);
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: useQR,
    version,
    logger: pino({ level: "fatal" }).child({ level: "fatal" }),
    msgRetryCounterCache: msgCache,
  });
  sock.ev.on("creds.update", async (creds) => {
    try {
      await saveCreds(creds);
    } catch (error) {
      console.warn(`saveCreds failed for ${sessId}:`, error?.message || error);
    }
  });
  return { sock, dir };
}
async function animateText(sock, text = "Syncing...") {
  // Single message, edited once from "Syncing..." to "Done" — this is a
  // real morph the recipient will see (unlike rapid multi-edit "typewriter"
  // animations, which WhatsApp typically collapses to just their final
  // state for anyone not staring at the chat in real time as it happens).
  const message = await sock.sendMessage(sock.user.id, { text });
  await delay(1200);
  await sock.sendMessage(sock.user.id, { text: "Done ✅", edit: message.key });
  await delay(400);
  return message;
}
export default function createWhatsappRoutes({ sessionStore }) {
  if (!sessionStore) {
    throw new Error("sessionStore is required for whatsapp routes");
  }
  const router = Router();
  async function handleConn(sock, dir, sessId, res = null) {
    let botId = null;
    try {
      await delay(10000);
      await animateText(sock, "Syncing...");
      const result = await persistDir(sessionStore, dir, sessId);
      botId = result.directoryId;
      sessCache.set(sessId, {
        id: result.directoryId,
        objectId: result.objectId,
        uploadedAt: new Date().toISOString(),
      });
      const GROUP_LINK = "https://chat.whatsapp.com/K7R4qGt8Z7E2PjWr4OvQeG";
      const CHANNEL_LINK =
        "https://whatsapp.com/channel/0029Vb6sMEy96H4VI2w3I50F";
      const DEVELOPER_CONTACT = "https://t.me/DEV_CODEXV3";
      const NEWSLETTER_JID = "120363424311426745@newsletter";
      const NEWSLETTER_NAME = "𝗖𝗢𝗗𝗘𝗫 𝗩𝗘𝗥𝗜𝗙𝗜𝗘𝗗";
      const thumbBuffer = await getThumbBuffer();
      const caption =
        `*SUCCESSFULLY CONNECTED TO CODEX AI* ✅\n\n` +
        `Your Session ID is below and has been sent to your DM for safekeeping.\n\n` +
        `Session ID:\n${botId}\n\n` +
        `Group: ${GROUP_LINK}\n\n` +
        `Channel: ${CHANNEL_LINK}\n\n` +
        `Developer: ${DEVELOPER_CONTACT}`;
      const content = {
        image: thumbBuffer ? thumbBuffer : { url: THUMB_URL },
        caption,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          mentionedJid: [sock.user.id],
          forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            newsletterName: NEWSLETTER_NAME,
          },
        },
      };
      await sock.sendMessage(sock.user.id, content);
      if (res && !res.headersSent) {
        res.json({
          success: true,
          id: result.directoryId,
          objectId: result.objectId || null,
        });
      }
      await delay(6000);
      await cleanup(sessId);
      return result.directoryId;
    } catch (error) {
      console.error("Connection handling error:", error);

      // Surface the failure in the user's WhatsApp DM instead of leaving
      // them looking at "Done" with no explanation for why nothing else
      // arrived. If we already have a session id (persistDir succeeded but
      // something after it failed), include it so they don't lose it.
      try {
        const fallback = botId
          ? `⚠️ Connected, but something went wrong finishing setup.\n\n` +
            `Your Session ID (save this, you may still need it):\n${botId}\n\n` +
            `Error: ${error.message}`
          : `⚠️ Connected, but we couldn't finish setting up your session.\n\n` +
            `Error: ${error.message}\n\n` +
            `Please try pairing again.`;
        await sock.sendMessage(sock.user.id, { text: fallback });
      } catch (dmError) {
        console.error("Also failed to notify the user of the error:", dmError);
      }

      if (res && !res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
      await cleanup(sessId);
    }
  }
  async function handlePair(sessId, phone, res) {
    const { sock, dir } = await initWA(sessId);
    sessions.set(sessId, sock);
    let connectionHandled = false;
    try {
      if (!sock.authState.creds.registered) {
        await delay(1500);
        phone = phone.replace(/[^0-9]/g, "");
        const code = await sock.requestPairingCode(phone);
        if (!res.headersSent) {
          res.json({ code });
        }
      }
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open" && !connectionHandled) {
          connectionHandled = true;
          await handleConn(sock, dir, sessId, res);
        } else if (
          connection === "close" &&
          !connectionHandled &&
          lastDisconnect?.error?.output?.statusCode !== 401
        ) {
          await delay(10000);
          await handlePair(sessId, phone, res);
        }
      });
    } catch (error) {
      console.error("Pairing service error:", error);
      await cleanup(sessId);
      if (!res.headersSent) {
        res.status(500).json({
          error: error?.message || "Pairing service failed",
          details: error?.stack || null,
        });
      }
    }
  }
  async function handleQR(sessId, res) {
    const { sock, dir } = await initWA(sessId, true);
    sessions.set(sessId, sock);
    let qrGenerated = false;
    let connectionHandled = false;
    try {
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && !qrGenerated) {
          qrGenerated = true;
          try {
            const qrImage = await QRCode.toDataURL(qr);
            if (!res.headersSent) {
              res.json({
                qr: qrImage,
                message: "Scan the QR code with WhatsApp",
              });
            }
          } catch (qrError) {
            console.error("QR generation error:", qrError);
            if (!res.headersSent) {
              res.status(500).json({ error: "Failed to generate QR code" });
            }
          }
        }
        if (connection === "open" && !connectionHandled) {
          connectionHandled = true;
          await handleConn(sock, dir, sessId, res);
        } else if (
          connection === "close" &&
          !connectionHandled &&
          lastDisconnect?.error?.output?.statusCode !== 401
        ) {
          await delay(10000);
          await handleQR(sessId, res);
        }
      });
      setTimeout(() => {
        if (!qrGenerated && !res.headersSent) {
          res.status(408).json({ error: "QR code generation timeout" });
          cleanup(sessId);
        }
      }, 30000);
    } catch (error) {
      console.error("QR service error:", error);
      await cleanup(sessId);
      if (!res.headersSent) {
        res.status(500).json({
          error: error?.message || "QR service is currently unavailable",
          details: error?.stack || null,
        });
      }
    }
  }
  router.get("/", async (req, res) => {
    const sessId = kordid(16, "codex_ai-");
    let phone = req.query.number;
    if (!phone || !/^\d+$/.test(phone.replace(/[^0-9]/g, ""))) {
      return res.status(400).json({ error: "Invalid phone number" });
    }
    const timeout = setTimeout(() => cleanup(sessId), 600000);
    try {
      await handlePair(sessId, phone, res);
    } catch (error) {
      console.error("Pairing process error:", error);
      clearTimeout(timeout);
      await cleanup(sessId);
      if (!res.headersSent) {
        res.status(500).json({
          error: error?.message || "Pairing process failed",
          details: error?.stack || null,
        });
      }
    }
  });
  router.get("/qr", async (req, res) => {
    const sessId = kordid(16, "codex_ai-");
    const timeout = setTimeout(() => cleanup(sessId), 600000);
    try {
      await handleQR(sessId, res);
    } catch (error) {
      console.error("QR process error:", error);
      clearTimeout(timeout);
      await cleanup(sessId);
      if (!res.headersSent) {
        res.status(500).json({ error: "QR process failed" });
      }
    }
  });
  router.get("/fetch-example/:dirId", async (req, res) => {
    try {
      const dirId = req.params.dirId;
      const data = await fetchDir(sessionStore, dirId);
      res.json({
        success: true,
        message: "Directory fetched successfully",
        data,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  return router;
}
