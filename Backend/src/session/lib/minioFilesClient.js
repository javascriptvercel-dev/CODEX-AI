import { Client } from "minio";
import axios from "axios";
function toMinioError(error, context, extra = null) {
  const msg = error?.message || "Unknown MinIO error";
  const err = new Error(`${context} failed: ${msg}`);
  err.code = error?.code || null;
  err.context = context;
  if (extra) err.extra = extra;
  console.error(`[MinioFilesClient] ${context} raw error:`, {
    code: error?.code,
    message: error?.message,
    extra,
  });
  return err;
}
class MinioFilesClient {
  constructor({ endPoint, port, useSSL, accessKey, secretKey }) {
    if (!endPoint) throw new Error("MINIO_ENDPOINT is required");
    if (!accessKey) throw new Error("MINIO_ACCESS_KEY is required");
    if (!secretKey) throw new Error("MINIO_SECRET_KEY is required");
    this.client = new Client({
      endPoint,
      port: port ? Number(port) : undefined,
      useSSL: Boolean(useSSL),
      accessKey,
      secretKey,
    });
  }
  async createBucket({ name, isPublic = false }) {
    try {
      const exists = await this.client.bucketExists(name).catch(() => false);
      if (!exists) {
        await this.client.makeBucket(name);
      }
      if (isPublic) {
        await this.setPublicReadPolicy(name);
      }
      return { id: name, name, public: isPublic };
    } catch (error) {
      throw toMinioError(error, "MinIO create bucket", { name });
    }
  }
  async setPublicReadPolicy(bucketName) {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };
    await this.client.setBucketPolicy(bucketName, JSON.stringify(policy));
  }
  async uploadFile({ bucketId, fileName, content }) {
    try {
      const buffer = Buffer.from(content, "utf8");
      await this.client.putObject(bucketId, fileName, buffer, buffer.length, {
        "Content-Type": "application/json",
      });
      const stat = await this.client.statObject(bucketId, fileName);
      return {
        name: fileName,
        objectId: fileName,
        bucket: bucketId,
        size: stat.size,
        etag: stat.etag,
      };
    } catch (error) {
      throw toMinioError(error, "MinIO upload", { bucketId, fileName });
    }
  }
  async listObjects(bucketId) {
    try {
      return await new Promise((resolve, reject) => {
        const objects = [];
        const stream = this.client.listObjectsV2(bucketId, "", true);
        stream.on("data", (obj) => {
          objects.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
            etag: obj.etag,
          });
        });
        stream.on("error", reject);
        stream.on("end", () => resolve(objects));
      });
    } catch (error) {
      throw toMinioError(error, "MinIO list objects", { bucketId });
    }
  }
  async deleteObject({ bucketId, fileName }) {
    try {
      await this.client.removeObject(bucketId, fileName);
      return { deleted: true, bucket: bucketId, name: fileName };
    } catch (error) {
      throw toMinioError(error, "MinIO delete object", { bucketId, fileName });
    }
  }
  async downloadFile({ bucketId, fileName }) {
    try {
      return await new Promise((resolve, reject) => {
        this.client.getObject(bucketId, fileName, (err, stream) => {
          if (err) return reject(err);
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => {
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            } catch (parseError) {
              reject(parseError);
            }
          });
          stream.on("error", reject);
        });
      });
    } catch (error) {
      throw toMinioError(error, "MinIO download", { bucketId, fileName });
    }
  }
  async getPresignedUrl({ bucketId, fileName, expirySeconds = 3600 }) {
    try {
      return await this.client.presignedGetObject(
        bucketId,
        fileName,
        expirySeconds,
      );
    } catch (error) {
      throw toMinioError(error, "MinIO presigned URL", { bucketId, fileName });
    }
  }
  async downloadJsonByUrl(url) {
    try {
      const response = await axios.get(url, { timeout: 30000 });
      return response.data;
    } catch (error) {
      throw toMinioError(error, "MinIO download by URL", { url });
    }
  }
}
export default MinioFilesClient;
