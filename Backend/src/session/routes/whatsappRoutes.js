import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import pino from "pino";
import QRCode from "qrcode";
import makeWASocket, {
  useMultiFileAuthState,
  delay,
  fetchLatestBaileysVersion,
  prepareWAMessageMedia,
  generateMessageIDV2,
} from "baileys";
import NodeCache from "node-cache";
import { kordid } from "../lib/kordid.js";

const msgCache = new NodeCache();
const sessCache = new NodeCache({ stdTTL: 600 });
const sessions = new Map();
const qrStates = new NodeCache({ stdTTL: 600 });

// Sends `text` with a native WhatsApp group-invite preview card attached to
// `groupLink` inside it — the actual group icon, name and member count as
// fetched live from the invite code, exactly like pasting the link yourself.
// No hosted thumbnail, no forwarded/"view channel" tag — just the same card
// WhatsApp itself renders for any group-invite link. Falls back to plain
// text if the invite can't be resolved (offline, revoked, etc.) so the
// message still goes out either way.
async function sendAsGroupInviteCard(sock, jid, text, groupLink, options = {}) {
  const inviteCode = groupLink.split("chat.whatsapp.com/")[1]?.split(/[?\s]/)[0];
  if (!inviteCode) {
    return sock.sendMessage(jid, { text }, options);
  }

  try {
    const info = await sock.groupGetInviteInfo(inviteCode);
    const groupJid = info.id;
    const groupName = info.subject || "WhatsApp Group";
    const memberCount = info.size ?? info.participants?.length;

    let photoUrl = null;
    try {
      photoUrl = await sock.profilePictureUrl(groupJid, "image");
    } catch {}

    let hq = null;
    let smallThumb = null;
    if (photoUrl) {
      try {
        const prepared = await prepareWAMessageMedia(
          { image: { url: photoUrl } },
          { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" },
        );
        hq = prepared.imageMessage;
        smallThumb = hq?.jpegThumbnail ? Buffer.from(hq.jpegThumbnail) : null;
      } catch (err) {
        console.warn("Group thumb upload failed:", err.message);
      }
    }

    const quoted = options.quoted;
    const message = {
      extendedTextMessage: {
        text,
        matchedText: groupLink,
        canonicalUrl: groupLink,
        title: groupName,
        description: memberCount != null
          ? `${memberCount} members · WhatsApp Group Invite`
          : "WhatsApp Group Invite",
        previewType: 5, // IMAGE
        jpegThumbnail: smallThumb || undefined,
        ...(hq
          ? {
              thumbnailDirectPath: hq.directPath,
              mediaKey: hq.mediaKey,
              mediaKeyTimestamp: hq.mediaKeyTimestamp,
              thumbnailWidth: hq.width,
              thumbnailHeight: hq.height,
              thumbnailSha256: hq.fileSha256,
              thumbnailEncSha256: hq.fileEncSha256,
            }
          : {}),
        ...(quoted
          ? {
              contextInfo: {
                stanzaId: quoted.key.id,
                participant: quoted.key.participant || quoted.key.remoteJid,
                quotedMessage: quoted.message,
              },
            }
          : {}),
      },
    };

    const messageId = generateMessageIDV2(sock.user.id);
    return sock.relayMessage(jid, message, { messageId });
  } catch (err) {
    console.warn("Group invite preview failed, sending plain text:", err.message);
    return sock.sendMessage(jid, { text }, options);
  }
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

async function cleanup(sessId, { removeAuth = true } = {}) {
  try {
    const dir = path.join(getTempDir(), `kordai_${sessId}`);
    if (removeAuth && fs.existsSync(dir)) {
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
    const payload = {
      directoryId,
      savedAt: new Date().toISOString(),
      files,
    };

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

async function animateText(sock, text) {
  let currentText = "";
  const sentMessage = await sock.sendMessage(sock.user.id, {
    text: currentText,
  });

  for (let i = 0; i < text.length; i++) {
    currentText += text[i];
    await sock.sendMessage(sock.user.id, {
      text: currentText,
      edit: sentMessage.key,
    });
    await delay(200);
  }

  await delay(500);

  for (let i = 0; i < text.length; i++) {
    currentText = text.substring(0, i);
    await sock.sendMessage(sock.user.id, {
      text: currentText,
      edit: sentMessage.key,
    });
    await delay(150);
  }

  await delay(300);

  currentText = "";
  for (let i = 0; i < text.length; i++) {
    currentText += text[i];
    await sock.sendMessage(sock.user.id, {
      text: currentText,
      edit: sentMessage.key,
    });
    await delay(180);
  }

  await delay(800);
  await sock.sendMessage(sock.user.id, { text: "done", edit: sentMessage.key });
  await delay(500);

  return sentMessage;
}

export default function createWhatsappRoutes({ sessionStore }) {
  if (!sessionStore) {
    throw new Error("sessionStore is required for whatsapp routes");
  }

  const router = express.Router();

  async function handleConn(sock, dir, sessId, res = null) {
    try {
      await delay(10000);
      await animateText(sock, "syncin..");

      const result = await persistDir(sessionStore, dir, sessId);
      const botId = result.directoryId;
      sessCache.set(sessId, {
        id: result.directoryId,
        objectId: result.objectId,
        uploadedAt: new Date().toISOString(),
      });
      qrStates.set(sessId, {
        state: "connected",
        sessionId: sessId,
        id: sessId,
        objectId: result.objectId || null,
      });

      const sess = await sock.sendMessage(sock.user.id, { text: botId });

      const GROUP_LINK =
        "https://chat.whatsapp.com/If0d4XKHITO2NUf6YvQ3Eg?s=cl&p=a&mlu=4&ilr=4";
      const CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb6sMEy96H4VI2w3I50F";
      const DEVELOPER_CONTACT = "https://t.me/CODEXVERIFIED";

      const caption =
        `SESSION SYNCED\n\n` +
        `Session ID: ${botId}\n\n` +
        `Support: ${GROUP_LINK}\n\n` +
        `Channel: ${CHANNEL_LINK}\n\n` +
        `Repository: https://github.com/codexverified/CODEX-AI\n\n` +
        `Developer: ${DEVELOPER_CONTACT}\n\n` +
        `Use your Session ID above to deploy your bot.\n\n` +
        `Don't forget to give a Star⭐ to my repo.`;
        

      await sendAsGroupInviteCard(sock, sock.user.id, caption, GROUP_LINK, {
        quoted: sess,
      });
      if (res && !res.headersSent) {
        res.json({
          success: true,
          id: result.directoryId,
          sessionId: sessId,
          objectId: result.objectId || null,
        });
      }

      await delay(6000);
      await cleanup(sessId);
      return result.directoryId;
    } catch (error) {
      console.error("Connection handling error:", error);
      qrStates.set(sessId, { state: "failed", error: error.message });
      if (res && !res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
      await cleanup(sessId);
    }
  }

  async function handlePair(sessId, phone, res) {
    const { sock, dir } = await initWA(sessId);
    sessions.set(sessId, sock);

    try {
      if (!sock.authState.creds.registered) {
        await delay(1500);
        phone = phone.replace(/[^0-9]/g, "");
        const code = await sock.requestPairingCode(phone);
        if (!res.headersSent) {
          res.json({ code, sessionId: sessId, id: sessId });
        }
      }

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
          await handleConn(sock, dir, sessId, res);
        } else if (
          connection === "close" &&
          lastDisconnect?.error?.output?.statusCode !== 401
        ) {
          await cleanup(sessId, { removeAuth: false });
          await delay(10000);
          await handlePair(sessId, phone, res).catch((error) => {
            console.error(`Pairing reconnect failed for ${sessId}:`, error);
          });
        }
      });
    } catch (error) {
      console.error("Pairing service error:", error);
      await cleanup(sessId);
      if (!res.headersSent) {
        res.json({ code: "Service is Currently Unavailable" });
      }
    }
  }

  async function handleQR(sessId, res) {
    const { sock, dir } = await initWA(sessId, true);
    sessions.set(sessId, sock);

    let qrGenerated = false;

    try {
      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !qrGenerated) {
          qrGenerated = true;
          try {
            const qrImage = await QRCode.toDataURL(qr);
            qrStates.set(sessId, {
              state: "waiting",
              qr: qrImage,
              sessionId: sessId,
              id: sessId,
              message: "Scan this code with WhatsApp to continue",
            });
            if (!res.headersSent) {
              res.json({
                qr: qrImage,
                sessionId: sessId,
                id: sessId,
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

        if (connection === "open") {
          await handleConn(sock, dir, sessId, res);
        } else if (
          connection === "close" &&
          lastDisconnect?.error?.output?.statusCode !== 401
        ) {
          await cleanup(sessId, { removeAuth: false });
          await delay(10000);
          await handleQR(sessId, res).catch((error) => {
            console.error(`QR reconnect failed for ${sessId}:`, error);
          });
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
        res.status(500).json({ error: "QR service is currently unavailable" });
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
        res.status(500).json({ error: "Pairing process failed" });
      }
    }
  });

  router.get("/qr", async (req, res) => {
    const sessId = kordid(16, "codex_ai-");
    const timeout = setTimeout(() => cleanup(sessId), 600000);
    qrStates.set(sessId, { state: "starting", sessionId: sessId, id: sessId });

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

  router.get("/qr/status/:sessId", (req, res) => {
    const state = qrStates.get(req.params.sessId);
    if (!state) return res.status(404).json({ error: "QR session not found" });
    res.json(state);
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
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
}