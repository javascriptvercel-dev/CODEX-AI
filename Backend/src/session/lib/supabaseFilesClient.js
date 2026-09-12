import { supabase } from "../../config/supabase.js";

function toSupabaseError(error, context, extra = null) {
  const message = error?.message || "Unknown Supabase Storage error";
  const err = new Error(`${context} failed: ${message}`);
  err.code = error?.statusCode || error?.status || null;
  err.context = context;
  if (extra) err.extra = extra;
  console.error(`[SupabaseFilesClient] ${context} raw error:`, {
    code: error?.statusCode || error?.status,
    message,
    extra,
  });
  return err;
}

class SupabaseFilesClient {
  async createBucket({ name, isPublic = false }) {
    try {
      const { data, error } = await supabase.storage.createBucket(name, {
        public: Boolean(isPublic),
      });
      if (error && !/already exists/i.test(error.message || "")) {
        throw error;
      }
      return data || { id: name, name, public: Boolean(isPublic) };
    } catch (error) {
      throw toSupabaseError(error, "Supabase create bucket", { name });
    }
  }

  async uploadFile({ bucketId, fileName, content }) {
    try {
      const buffer = Buffer.from(content, "utf8");
      const { data, error } = await supabase.storage
        .from(bucketId)
        .upload(fileName, buffer, {
          contentType: "application/json",
          upsert: true,
        });
      if (error) throw error;

      return {
        name: data?.path || fileName,
        objectId: data?.id || data?.path || fileName,
        bucket: bucketId,
        size: buffer.length,
        etag: null,
      };
    } catch (error) {
      throw toSupabaseError(error, "Supabase upload", { bucketId, fileName });
    }
  }

  async listObjects(bucketId) {
    try {
      const objects = [];
      let offset = 0;
      const limit = 1000;

      while (true) {
        const { data, error } = await supabase.storage
          .from(bucketId)
          .list("", { limit, offset, sortBy: { column: "name", order: "asc" } });
        if (error) throw error;
        const batch = Array.isArray(data) ? data : [];
        objects.push(
          ...batch
            .filter((item) => item?.name)
            .map((item) => ({
              name: item.name,
              size: item.metadata?.size ?? item.metadata?.contentLength ?? null,
              lastModified: item.updated_at || item.created_at || null,
              etag: item.metadata?.eTag || item.metadata?.etag || null,
            })),
        );
        if (batch.length < limit) break;
        offset += limit;
      }

      return objects;
    } catch (error) {
      throw toSupabaseError(error, "Supabase list objects", { bucketId });
    }
  }

  async deleteObject({ bucketId, fileName }) {
    try {
      const { error } = await supabase.storage.from(bucketId).remove([fileName]);
      if (error) throw error;
      return { deleted: true, bucket: bucketId, name: fileName };
    } catch (error) {
      throw toSupabaseError(error, "Supabase delete object", { bucketId, fileName });
    }
  }

  async downloadFile({ bucketId, fileName }) {
    try {
      const { data, error } = await supabase.storage.from(bucketId).download(fileName);
      if (error) throw error;
      const text = Buffer.from(await data.arrayBuffer()).toString("utf8");
      return JSON.parse(text);
    } catch (error) {
      throw toSupabaseError(error, "Supabase download", { bucketId, fileName });
    }
  }

  async getPresignedUrl({ bucketId, fileName, expirySeconds = 3600 }) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketId)
        .createSignedUrl(fileName, expirySeconds);
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (error) {
      throw toSupabaseError(error, "Supabase signed URL", { bucketId, fileName });
    }
  }
}

export default SupabaseFilesClient;
