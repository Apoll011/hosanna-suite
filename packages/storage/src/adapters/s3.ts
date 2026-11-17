import { GetObjectCommand, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { Readable } from "node:stream";
import { StorageError, StorageNotFoundError } from "../types.js";
import type { ListInput, ListResult, MultipartPart, MultipartUpload, ObjectMetadata, ObjectStorage, PresignedUrl, TenantObjectStorage, UploadInput, UrlOptions } from "../types.js";

export type S3StorageConfig = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  uploadUrlExpiresInSeconds?: number;
  downloadUrlExpiresInSeconds?: number;
};

export function createS3Storage(config: S3StorageConfig): ObjectStorage {
  const client = new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    forcePathStyle: config.forcePathStyle ?? Boolean(config.endpoint),
    ...(config.accessKeyId && config.secretAccessKey ? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } } : {}),
  });
  const tenantApi = (tenant: string): TenantObjectStorage => {
    const keyOf = (key: string) => `${tenant}/${cleanKey(key)}`;
    const parse = (key: string, size?: number, contentType?: string, etag?: string, lastModified?: Date, metadata?: Record<string, string>): ObjectMetadata => ({ key: key.slice(tenant.length + 1), size: size ?? 0, ...(contentType ? { contentType } : {}), ...(etag ? { etag: etag.replaceAll('"', "") } : {}), ...(lastModified ? { lastModified } : {}), metadata: metadata ?? {} });
    const safe = async <T>(operation: () => Promise<T>): Promise<T> => {
      try { return await operation(); } catch (error) { throw mapError(error); }
    };
    return {
      async upload(input) {
        return safe(async () => {
          const result = await new Upload({ client, params: { Bucket: config.bucket, Key: keyOf(input.key), Body: input.body, ...(input.contentType ? { ContentType: input.contentType } : {}), ...(input.metadata ? { Metadata: input.metadata } : {}) } }).done();
          const size = input.size ?? (input.body instanceof Uint8Array ? input.body.byteLength : input.body instanceof Blob ? input.body.size : undefined);
          return parse(input.key, size, input.contentType, result.ETag, new Date(), input.metadata);
        });
      },
      async download(key) {
        return safe(async () => {
          const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: keyOf(key) }));
          if (!response.Body) throw new StorageNotFoundError(key);
          return response.Body.transformToWebStream();
        });
      },
      async downloadNode(key) {
        return safe(async () => {
          const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: keyOf(key) }));
          if (!response.Body) throw new StorageNotFoundError(key);
          return Readable.fromWeb(response.Body.transformToWebStream() as import("node:stream/web").ReadableStream);
        });
      },
      async delete(key) { await safe(() => client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: keyOf(key) })).then(() => undefined)); },
      async deleteMany(keys) {
        for (let i = 0; i < keys.length; i += 1000) await safe(async () => {
          const result = await client.send(new DeleteObjectsCommand({ Bucket: config.bucket, Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key: keyOf(Key) })) } }));
          if (result.Errors?.length) throw new StorageError("PROVIDER_ERROR", "S3 could not delete one or more objects", result.Errors);
        });
      },
      async exists(key) { return (await this.head(key)) !== null; },
      async head(key) {
        try {
          const result = await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: keyOf(key) }));
          return parse(key, result.ContentLength, result.ContentType, result.ETag, result.LastModified, result.Metadata);
        } catch (error) { const mapped = mapError(error); if (mapped instanceof StorageNotFoundError) return null; throw mapped; }
      },
      async list(input: ListInput = {}): Promise<ListResult> {
        return safe(async () => {
          const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
          const prefix = input.prefix ? `${tenant}/${cleanPrefix(input.prefix)}` : `${tenant}/`;
          const result = await client.send(new ListObjectsV2Command({ Bucket: config.bucket, Prefix: prefix, ContinuationToken: input.cursor, MaxKeys: input.limit ?? 1000 }));
          const objects = (result.Contents ?? []).map((item) => parse(item.Key ?? "", item.Size, undefined, item.ETag, item.LastModified));
          return { objects, ...(result.NextContinuationToken ? { nextCursor: result.NextContinuationToken } : {}) };
        });
      },
      async copy(sourceKey, destinationKey) {
        return safe(async () => {
          const source = await this.head(sourceKey);
          if (!source) throw new StorageNotFoundError(sourceKey);
          const result = await client.send(new CopyObjectCommand({ Bucket: config.bucket, Key: keyOf(destinationKey), CopySource: `${config.bucket}/${encodeURIComponent(keyOf(sourceKey)).replaceAll("%2F", "/")}` }));
          return { ...source, key: destinationKey, etag: result.CopyObjectResult?.ETag?.replaceAll('"', "") };
        });
      },
      async createUploadUrl(key, options: UrlOptions = {}): Promise<PresignedUrl> {
        return safe(async () => {
          const expiresIn = options.expiresInSeconds ?? config.uploadUrlExpiresInSeconds ?? 900;
          if (options.maxSizeBytes !== undefined) {
            const conditions: ( ["content-length-range", number, number] | ["eq", string, string])[] = [["content-length-range", 0, options.maxSizeBytes], ...(options.contentType ? [["eq", "$Content-Type", options.contentType] as ["eq", string, string]] : [])];
            const post = await createPresignedPost(client, { Bucket: config.bucket, Key: keyOf(key), Expires: expiresIn, Conditions: conditions, Fields: { ...(options.contentType ? { "Content-Type": options.contentType } : {}), ...(options.contentDisposition ? { "Content-Disposition": options.contentDisposition } : {}) } });
            return { url: post.url, method: "POST", fields: post.fields, headers: {}, expiresAt: new Date(Date.now() + expiresIn * 1000) };
          }
          const command = new (await import("@aws-sdk/client-s3")).PutObjectCommand({ Bucket: config.bucket, Key: keyOf(key), ...(options.contentType ? { ContentType: options.contentType } : {}), ...(options.contentDisposition ? { ContentDisposition: options.contentDisposition } : {}) });
          return { url: await getSignedUrl(client, command, { expiresIn }), method: "PUT", headers: { ...(options.contentType ? { "content-type": options.contentType } : {}), ...(options.contentDisposition ? { "content-disposition": options.contentDisposition } : {}) }, expiresAt: new Date(Date.now() + expiresIn * 1000) };
        });
      },
      async createDownloadUrl(key, options: UrlOptions = {}): Promise<PresignedUrl> {
        return safe(async () => {
          const expiresIn = options.expiresInSeconds ?? config.downloadUrlExpiresInSeconds ?? 900;
          const command = new GetObjectCommand({ Bucket: config.bucket, Key: keyOf(key), ...(options.contentType ? { ResponseContentType: options.contentType } : {}), ...(options.contentDisposition ? { ResponseContentDisposition: options.contentDisposition } : {}) });
          return { url: await getSignedUrl(client, command, { expiresIn }), method: "GET", headers: {}, expiresAt: new Date(Date.now() + expiresIn * 1000) };
        });
      },
      async createMultipartUpload(input) {
        return safe(async () => {
          const result = await client.send(new CreateMultipartUploadCommand({ Bucket: config.bucket, Key: keyOf(input.key), ...(input.contentType ? { ContentType: input.contentType } : {}), ...(input.metadata ? { Metadata: input.metadata } : {}) }));
          if (!result.UploadId) throw new StorageError("PROVIDER_ERROR", "S3 did not return an upload id");
          return { uploadId: result.UploadId, key: input.key };
        });
      },
      async uploadMultipartPart(upload: MultipartUpload, partNumber: number, body) {
        if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) throw new StorageError("INVALID_INPUT", "Part number must be between 1 and 10000");
        return safe(async () => {
          const result = await client.send(new UploadPartCommand({ Bucket: config.bucket, Key: keyOf(upload.key), UploadId: upload.uploadId, PartNumber: partNumber, Body: body }));
          if (!result.ETag) throw new StorageError("PROVIDER_ERROR", "S3 did not return a multipart part ETag");
          return { partNumber, etag: result.ETag };
        });
      },
      async createMultipartPartUrl(upload: MultipartUpload, partNumber: number, options = {}) {
        if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) throw new StorageError("INVALID_INPUT", "Part number must be between 1 and 10000");
        if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) throw new StorageError("INVALID_INPUT", "Part number must be between 1 and 10000");
        return safe(async () => ({ url: await getSignedUrl(client, new UploadPartCommand({ Bucket: config.bucket, Key: keyOf(upload.key), UploadId: upload.uploadId, PartNumber: partNumber }), { expiresIn: options.expiresInSeconds ?? config.uploadUrlExpiresInSeconds ?? 900 }), method: "PUT", headers: {}, expiresAt: new Date(Date.now() + (options.expiresInSeconds ?? config.uploadUrlExpiresInSeconds ?? 900) * 1000) }));
      },
      async completeMultipartUpload(upload: MultipartUpload, parts: MultipartPart[]) {
        return safe(async () => {
          const result = await client.send(new CompleteMultipartUploadCommand({ Bucket: config.bucket, Key: keyOf(upload.key), UploadId: upload.uploadId, MultipartUpload: { Parts: [...parts].sort((a, b) => a.partNumber - b.partNumber).map(({ partNumber, etag }) => ({ PartNumber: partNumber, ETag: etag })) } }));
          const metadata = await this.head(upload.key);
          return metadata ?? parse(upload.key, 0, undefined, result.ETag);
        });
      },
      async abortMultipartUpload(upload) { await safe(() => client.send(new AbortMultipartUploadCommand({ Bucket: config.bucket, Key: keyOf(upload.key), UploadId: upload.uploadId })).then(() => undefined)); },
    };
  };
  return { forTenant(tenantId) { validateTenant(tenantId); return tenantApi(tenantId); } };
}

function cleanKey(key: string) {
  const normalized = key.replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.includes("\0") || normalized.split("/").some((part) => part === ".." || part === ".")) throw new StorageError("INVALID_INPUT", "Object key must be a non-empty relative path");
  return normalized;
}

function cleanPrefix(prefix: string) {
  return `${cleanKey(prefix).replace(/\/$/, "")}/`;
}

function validateTenant(tenant: string) {
  if (!tenant.trim() || tenant.includes("/") || tenant === "." || tenant === "..") throw new StorageError("INVALID_INPUT", "Tenant id must be a non-empty path segment");
}

function mapError(error: unknown): Error {
  if (error instanceof StorageError) return error;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  if (candidate.name === "NoSuchKey" || candidate.name === "NotFound" || candidate.$metadata?.httpStatusCode === 404) return new StorageNotFoundError("unknown", error);
  if (candidate.name === "AccessDenied" || candidate.$metadata?.httpStatusCode === 403) return new StorageError("ACCESS_DENIED", "Storage access denied", error);
  return new StorageError("PROVIDER_ERROR", "S3 storage operation failed", error);
}
