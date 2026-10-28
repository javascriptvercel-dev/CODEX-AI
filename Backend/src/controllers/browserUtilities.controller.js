import { enforceToolRateLimit } from "../tools/rateLimit.js";

const BROWSER_UTILITY_SLUGS = new Set([
  "character-counter",
  "code-minifier",
  "password-generator",
  "qr-code-generator",
  "url-encoder-decoder",
  "uuid-generator",
]);

export async function consumeBrowserUtilityUsage(req, res) {
  const { tool } = req.params;
  if (!BROWSER_UTILITY_SLUGS.has(tool)) {
    return res.status(404).json({ error: "Browser utility not found." });
  }

  if (
    !(await enforceToolRateLimit(req, res, {
      tool,
      userLimit: 10,
      premiumUserLimit: 50,
      windowSeconds: 60 * 60,
    }))
  ) {
    return;
  }

  return res.json({ success: true });
}
