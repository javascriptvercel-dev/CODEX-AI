/**
 * Ban-check core: validates the number, calls the BanCheck API, and
 * normalizes the response into one predictable shape.
 * Uses Node's built-in fetch (Node 18+).
 */
import { env } from "../config/env.js";

const DEFAULT_TIMEOUT_MS = 15000;

export class BanCheckError extends Error {
  /**
   * @param {string} message  Safe-to-display message
   * @param {{ statusCode?: number, requestId?: string|null, code?: string }} [meta]
   */
  constructor(message, meta = {}) {
    super(message);
    this.name = "BanCheckError";
    this.statusCode = meta.statusCode;
    this.requestId = meta.requestId || null;
    // code: INVALID_NUMBER | NO_API_KEY | TIMEOUT | NETWORK | API_ERROR | RATE_LIMITED
    this.code = meta.code || "API_ERROR";
  }
}

/* ------------------------------ helpers ------------------------------ */

function firstString(...values) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

const TRUE_WORDS = new Set(["true", "yes", "1", "banned", "requested"]);
const FALSE_WORDS = new Set(["false", "no", "0", "not_banned", "not_requested"]);

function firstBool(...values) {
  for (const v of values) {
    if (typeof v === "boolean") return v;
    if (v === 1 || v === 0) return v === 1;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (TRUE_WORDS.has(s)) return true;
      if (FALSE_WORDS.has(s)) return false;
    }
  }
  return null;
}

function isoDate(value) {
  const raw = firstString(value);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toISOString();
}

/** Strip everything but digits and validate as an international number (E.164 length). */
export function cleanNumber(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!/^\d{7,15}$/.test(digits)) {
    throw new BanCheckError(
      "Invalid number. Use the full international format with country code, e.g. 2348123456789.",
      { code: "INVALID_NUMBER" },
    );
  }
  return digits;
}

/* --------------------------- response mapping --------------------------- */

/**
 * status: 'banned' | 'temporary_ban' | 'not_banned' | 'not_on_whatsapp' | 'unknown'
 */
export function normalizeResponse(data, number, checkedAt, requestId = null) {
  const d = data && typeof data === "object" ? data : {};
  const review = d.review && typeof d.review === "object" ? d.review : {};

  const rawStatus = (firstString(d.status, d.state) || "").toLowerCase().replace(/[_-]+/g, " ");
  const rawType = (firstString(d.type, d.banType, d.restrictionType) || "").toLowerCase();

  const reason = firstString(d.reason, d.violation, d.details, d.description);
  const reasons = Array.from(
    new Set(
      [reason, ...(Array.isArray(d.reasons) ? d.reasons : [])]
        .filter((r) => typeof r === "string" && r.trim())
        .map((r) => r.trim()),
    ),
  );

  // "not banned" must never be read as banned, so only trust a status word when it isn't negated.
  const statusSaysBanned = /\b(banned|ban|restricted)\b/.test(rawStatus) && !/\bnot\b/.test(rawStatus);
  const explicitBanned = firstBool(d.banned, d.isBanned);
  const banned = explicitBanned === true || (explicitBanned === null && statusSaysBanned);

  const temporary =
    banned &&
    (firstBool(d.temporary, d.isTemporary) === true ||
      rawType.includes("temporar") ||
      rawStatus.includes("temporar") ||
      reasons.some((r) => r.toLowerCase().includes("temporar")));

  const registered = firstBool(d.onWhatsApp, d.registered, d.isRegistered, d.exists);
  const notOnWhatsApp = registered === false || /not (on whatsapp|registered|found)/.test(rawStatus);

  let status = "unknown";
  if (notOnWhatsApp && !banned) status = "not_on_whatsapp";
  else if (banned) status = temporary ? "temporary_ban" : "banned";
  else if (explicitBanned === false || /\b(not banned|active|clean)\b/.test(rawStatus) || registered === true) status = "not_banned";

  const reviewRequested = firstBool(d.reviewRequested, d.appealRequested, review.requested, review.submitted);

  const messages = {
    banned: "This number is permanently banned from WhatsApp.",
    temporary_ban: "This number is temporarily banned from WhatsApp.",
    not_banned: "This number is active on WhatsApp.",
    not_on_whatsapp: "This number is not registered on WhatsApp.",
    unknown: "The status of this number could not be confirmed.",
  };

  return {
    number,
    status,
    banned,
    type: banned ? (temporary ? "temporary" : "permanent") : null,
    onWhatsApp: notOnWhatsApp ? false : status === "unknown" ? null : true,
    message: messages[status],
    reason,
    reasons,
    banTime: isoDate(d.banTime ?? d.bannedAt ?? d.banDate ?? d.restrictedAt),
    reviewRequested: banned ? reviewRequested : null,
    reviewTime: isoDate(d.reviewTime ?? d.appealTime ?? d.reviewedAt ?? review.requestedAt ?? review.submittedAt),
    checkedAt,
    requestId: firstString(requestId, d.requestId, d.request_id),
  };
}

/* ------------------------------- the check ------------------------------- */

/**
 * @param {string} input  Raw phone number typed by a user
 * @param {{ apiKey?: string, apiUrl?: string, timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 */
export async function checkNumber(input, options = {}) {
  const digits = cleanNumber(input);
  const apiKey = options.apiKey ?? env.banCheck.apiKey;
  const apiUrl = options.apiUrl ?? env.banCheck.apiUrl;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const doFetch = options.fetchImpl ?? globalThis.fetch;

  if (!apiKey) {
    throw new BanCheckError("The BanCheck API key is not configured.", { code: "NO_API_KEY" });
  }
  if (typeof doFetch !== "function") {
    throw new BanCheckError("This runtime has no fetch(). Please use Node 18 or newer.", { code: "NETWORK" });
  }

  const number = `+${digits}`;
  const checkedAt = new Date().toISOString();

  let response;
  try {
    response = await doFetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ number }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new BanCheckError("The BanCheck API took too long to respond. Try again shortly.", { code: "TIMEOUT" });
    }
    throw new BanCheckError("Could not reach the BanCheck API. Check your connection and try again.", { code: "NETWORK" });
  }

  let data = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === "object") data = parsed;
  } catch {
    /* non-JSON body — handled below */
  }

  const requestId = firstString(data.requestId, data.request_id, response.headers?.get?.("x-request-id"));

  if (!response.ok) {
    const detail = firstString(data.detail, data.title, data.message) || "The API rejected the request.";
    throw new BanCheckError(detail, {
      statusCode: response.status,
      requestId,
      code: response.status === 429 ? "RATE_LIMITED" : "API_ERROR",
    });
  }

  return normalizeResponse(data, number, checkedAt, requestId);
}
