export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(404).json({ error: "Not found." });
  }
  next();
};
