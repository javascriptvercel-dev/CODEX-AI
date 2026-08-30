import fs from "fs-extra";
function cleanSessionId(id) {
  return String(id).trim();
}
function toFilename(sessionId) {
  return `session-${sessionId}.json`;
}
function sessionIdFromName(name) {
  if (!name || typeof name !== "string") return null;
  const justName = name.split("/").pop();
  const match = justName.match(/^session-(.+)\.json$/);
  return match ? match[1] : null;
}
class SessionStore {
  constructor({ bucketService, indexFilePath, bucketId }) {
    if (!bucketService) {
      throw new Error("bucketService is required for SessionStore");
    }
    this.bucketService = bucketService;
    this.indexFilePath = indexFilePath;
    this.bucketId = bucketId || "";
  }
  setBucketId(bucketId) {
    this.bucketId = String(bucketId);
  }
  async ensureIndexFile() {
    await fs.ensureFile(this.indexFilePath);
    const text = await fs.readFile(this.indexFilePath, "utf8");
    if (!text.trim()) {
      await fs.writeJson(this.indexFilePath, {}, { spaces: 2 });
    }
  }
  async readIndex() {
    await this.ensureIndexFile();
    return fs.readJson(this.indexFilePath);
  }
  async writeIndex(index) {
    await fs.writeJson(this.indexFilePath, index, { spaces: 2 });
  }
  ensureBucketId() {
    if (!this.bucketId) {
      throw new Error(
        "Bucket is not configured. Set MINIO_BUCKET or create one via /buckets/init.",
      );
    }
  }
  async saveSession(sessionId, payload) {
    this.ensureBucketId();
    const normalizedId = cleanSessionId(sessionId);
    if (!normalizedId) {
      throw new Error("sessionId is required");
    }
    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload)
    ) {
      throw new Error("payload must be a JSON object");
    }
    if (payload.id && String(payload.id) !== normalizedId) {
      throw new Error("payload.id must match route session id");
    }
    const sessionData = {
      ...payload,
      id: normalizedId,
      updatedAt: new Date().toISOString(),
    };
    const fileName = toFilename(normalizedId);
    const uploadResult = await this.bucketService.uploadFile({
      bucketId: this.bucketId,
      fileName,
      content: JSON.stringify(sessionData, null, 2),
    });
    const index = await this.readIndex();
    index[normalizedId] = {
      bucketId: this.bucketId,
      filename: fileName,
      size: uploadResult?.size ?? null,
      etag: uploadResult?.etag ?? null,
      savedAt: new Date().toISOString(),
    };
    await this.writeIndex(index);
    return { session: sessionData, storage: index[normalizedId], uploadResult };
  }
  async resolveSessionObject(sessionId) {
    this.ensureBucketId();
    const normalizedId = cleanSessionId(sessionId);
    const index = await this.readIndex();
    const indexed = index[normalizedId] || null;
    const fileName = indexed?.filename || toFilename(normalizedId);
    const objects = await this.bucketService.listObjects(this.bucketId);
    const fromList = objects.find((obj) => obj.name === fileName) || null;
    return {
      id: normalizedId,
      name: fileName,
      size: fromList?.size ?? indexed?.size ?? null,
      existsInIndex: Boolean(indexed),
      existsInBucket: Boolean(fromList),
    };
  }
  async getSession(sessionId) {
    const ref = await this.resolveSessionObject(sessionId);
    if (!ref.existsInBucket) {
      throw new Error(
        `No file found in bucket for session '${ref.id}'. Save it first.`,
      );
    }
    const data = await this.bucketService.downloadFile({
      bucketId: this.bucketId,
      fileName: ref.name,
    });
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      throw new Error("Stored session content is not a JSON object");
    }
    return { id: ref.id, data, storage: ref };
  }
  async getPresignedUrl(sessionId, expirySeconds = 3600) {
    const ref = await this.resolveSessionObject(sessionId);
    if (!ref.existsInBucket) {
      throw new Error(`No file found in bucket for session '${ref.id}'.`);
    }
    return this.bucketService.getPresignedUrl({
      bucketId: this.bucketId,
      fileName: ref.name,
      expirySeconds,
    });
  }
  async deleteSession(sessionId) {
    this.ensureBucketId();
    const ref = await this.resolveSessionObject(sessionId);
    if (!ref.existsInBucket) {
      throw new Error(`No file found in bucket for session '${ref.id}'.`);
    }
    const result = await this.bucketService.deleteObject({
      bucketId: this.bucketId,
      fileName: ref.name,
    });
    const index = await this.readIndex();
    delete index[ref.id];
    await this.writeIndex(index);
    return { id: ref.id, name: ref.name, deleteResult: result };
  }
  async listSessions() {
    this.ensureBucketId();
    const objects = await this.bucketService.listObjects(this.bucketId);
    const index = await this.readIndex();
    return objects
      .map((obj) => {
        const id = sessionIdFromName(obj.name || "");
        if (!id) return null;
        const indexed = index[id] || null;
        return { id, name: obj.name, size: obj.size ?? indexed?.size ?? null };
      })
      .filter(Boolean);
  }
}
export default SessionStore;
