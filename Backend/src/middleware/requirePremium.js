import { env } from "../config/env.js";
import { isPremiumUser } from "../utils/premium.js";

export const requirePremium = (req, res, next) => {
  if (!env.premiumFeaturesEnabled) {
    return res.status(503).json({ error: "Premium features aren't available yet." });
  }
  if (!isPremiumUser(req.user)) {
    return res.status(403).json({
      error: "An active Premium account is required to use this feature.",
      code: "PREMIUM_REQUIRED",
    });
  }
  next();
};
