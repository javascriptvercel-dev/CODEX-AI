import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
const COOKIE_NAME = "codex_session";
export const signSession = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: "30d",
  });
export const verifySession = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
};
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  path: "/",
};
export const setSessionCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};
export const clearSessionCookie = (res) => {
  // Must match setSessionCookie's options exactly (minus maxAge/expires) or
  // browsers will treat this as a different cookie and won't clear it.
  res.clearCookie(COOKIE_NAME, SESSION_COOKIE_OPTIONS);
};
export { COOKIE_NAME };