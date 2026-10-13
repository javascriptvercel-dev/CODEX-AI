import { supabase } from "../config/supabase.js";

export async function enforceToolRateLimit(
  req,
  res,
  { tool, userLimit, windowSeconds },
) {
  if (!req.user?.id) {
    res.status(401).json({ error: "Sign in to use this tool." });
    return false;
  }
  if (req.user?.role === "admin") return true;

  const subjectKey = `user:${req.user.id}`;
  const limit = userLimit;
  const { data, error } = await supabase.rpc("consume_tool_rate_limit", {
    p_subject_key: subjectKey,
    p_tool_slug: tool,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error(`[tools] ${tool} rate-limit check failed:`, error);
    res.status(503).json({
      error: "This tool is temporarily unavailable. Please try again shortly.",
    });
    return false;
  }

  const result = Array.isArray(data) ? data[0] : null;
  if (
    typeof result?.allowed !== "boolean" ||
    !Number.isInteger(result?.retry_after) ||
    !Number.isInteger(result?.remaining)
  ) {
    console.error(`[tools] ${tool} rate-limit check returned an invalid result.`);
    res.status(503).json({
      error: "This tool is temporarily unavailable. Please try again shortly.",
    });
    return false;
  }

  res.set("RateLimit-Limit", String(limit));
  res.set("RateLimit-Remaining", String(result.remaining));
  res.set("RateLimit-Reset", String(result.retry_after));

  if (!result.allowed) {
    res.set("Retry-After", String(result.retry_after));
    res.status(429).json({
      error: `You've reached the limit for ${tool.replaceAll("-", " ")}. Try again in ${result.retry_after} seconds.`,
      retryAfter: result.retry_after,
    });
    return false;
  }

  return true;
}
