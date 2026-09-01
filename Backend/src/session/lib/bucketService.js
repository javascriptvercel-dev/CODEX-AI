class BucketService {
  constructor({ filesClient }) {
    if (!filesClient) {
      throw new Error("filesClient is required for BucketService");
    }
    this.filesClient = filesClient;
  }
  async createBucket({ name, isPublic = false }) {
    return this.filesClient.createBucket({ name, isPublic });
  }
  async uploadFile({ bucketId, fileName, content }) {
    if (!bucketId) throw new Error("bucketId is required");
    if (!fileName) throw new Error("fileName is required");
    return this.filesClient.uploadFile({ bucketId, fileName, content });
  }
  async listObjects(bucketId) {
    if (!bucketId) throw new Error("bucketId is required");
    return this.filesClient.listObjects(bucketId);
  }
  async deleteObject({ bucketId, fileName }) {
    if (!bucketId) throw new Error("bucketId is required");
    if (!fileName) throw new Error("fileName is required");
    return this.filesClient.deleteObject({ bucketId, fileName });
  }
  async downloadFile({ bucketId, fileName }) {
    if (!bucketId) throw new Error("bucketId is required");
    if (!fileName) throw new Error("fileName is required");
    return this.filesClient.downloadFile({ bucketId, fileName });
  }
  async getPresignedUrl({ bucketId, fileName, expirySeconds = 3600 }) {
    if (!bucketId) throw new Error("bucketId is required");
    if (!fileName) throw new Error("fileName is required");
    return this.filesClient.getPresignedUrl({
      bucketId,
      fileName,
      expirySeconds,
    });
  }
}
export default BucketService;
