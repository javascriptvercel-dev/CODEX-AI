import { Router } from "express";
export default function createSessionRoutes({ sessionStore }) {
  const router = Router();
  router.get("/", async (req, res, next) => {
    try {
      const sessions = await sessionStore.listSessions();
      res.json({ count: sessions.length, sessions });
    } catch (error) {
      next(error);
    }
  });
  router.post("/:id", async (req, res, next) => {
    try {
      const result = await sessionStore.saveSession(req.params.id, req.body);
      res.status(201).json({ message: "Session saved", ...result });
    } catch (error) {
      next(error);
    }
  });
  router.put("/:id", async (req, res, next) => {
    try {
      const result = await sessionStore.saveSession(req.params.id, req.body);
      res.json({ message: "Session updated", ...result });
    } catch (error) {
      next(error);
    }
  });
  router.get("/:id", async (req, res, next) => {
    try {
      const result = await sessionStore.getSession(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  router.delete("/:id", async (req, res, next) => {
    try {
      const result = await sessionStore.deleteSession(req.params.id);
      res.json({ message: "Session deleted", ...result });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
