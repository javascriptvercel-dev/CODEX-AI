import { supabase } from "../config/supabase.js";

const CACHE_TTL_MS = 60_000;
let cachedUserCount = null;
let cachedAt = 0;

export const getPublicStats = async (_req, res) => {
  if (cachedUserCount !== null && Date.now() - cachedAt < CACHE_TTL_MS) {
    res.set("Cache-Control", "public, max-age=60");
    return res.json({ registeredUsers: cachedUserCount });
  }

  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("getPublicStats failed", error);
    return res.status(500).json({ error: "Could not load public statistics." });
  }

  cachedUserCount = count ?? 0;
  cachedAt = Date.now();
  res.set("Cache-Control", "public, max-age=60");
  return res.json({ registeredUsers: cachedUserCount });
};
