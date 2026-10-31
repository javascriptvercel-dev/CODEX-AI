import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

function formatRetryAfter(seconds) {
  const totalMinutes = Math.ceil(Math.max(seconds, 1) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
  }
  if (minutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export async function enforceToolRateLimit(
  req,
  res,
  { tool, userLimit, windowSeconds, premiumUserLimit = userLimit * 5 },
) {
  if (!req.user?.id) {
    res.status(401).json({ error: "Sign in to use this tool." });
    return false;
  }
  if (req.user?.role === "admin") return true;

  const subjectKey = `user:${req.user.id}`;
  const premium = Boolean(
    env.premiumFeaturesEnabled &&
    req.user.premium_until &&
    Date.parse(req.user.premium_until) > Date.now(),
  );
  const limit = premium ? premiumUserLimit : userLimit;
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
      error: `You've reached the limit for ${tool.replaceAll("-", " ")}. Try again in ${formatRetryAfter(result.retry_after)}.`,
      retryAfter: result.retry_after,
    });
    return false;
  }

  if (env.premiumFeaturesEnabled) {
    const { error: usageError } = await supabase.from("tool_usage_events").insert({
      user_id: req.user.id,
      tool_slug: tool,
    });
    if (usageError) {
      console.error(`[tools] ${tool} activity logging failed:`, usageError);
      res.status(503).json({ error: "This tool is temporarily unavailable. Please try again shortly." });
      return false;
    }
  }

  return true;
}
