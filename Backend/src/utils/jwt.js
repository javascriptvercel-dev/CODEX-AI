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
export const setSessionCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};
export const clearSessionCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
};
export { COOKIE_NAME };
