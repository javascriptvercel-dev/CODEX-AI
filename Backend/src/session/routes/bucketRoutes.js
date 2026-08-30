import { Router } from "express";
export default function createBucketRoutes({
  bucketService,
  sessionStore,
  config,
}) {
  const router = Router();
  router.post("/init", async (req, res, next) => {
    try {
      const name = req.body?.name || config.defaultBucketName;
      const isPublic = req.body?.public ?? config.defaultBucketPublic;
      const created = await bucketService.createBucket({ name, isPublic });
      const bucketId = created?.id ?? created?.bucketId ?? created?.bucket_id;
      if (!bucketId) {
        return res
          .status(502)
          .json({
            error: "Bucket created but no bucket id was returned by MinIO",
            response: created,
          });
      }
      sessionStore.setBucketId(String(bucketId));
      res
        .status(201)
        .json({
          message: "Bucket created and bound for this runtime",
          bucketId: String(bucketId),
          bucket: created,
        });
    } catch (error) {
      next(error);
    }
  });
  router.get("/:bucketId/objects", async (req, res, next) => {
    try {
      const { bucketId } = req.params;
      const objects = await bucketService.listObjects(bucketId);
      res.json({ bucketId, count: objects.length, objects });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
