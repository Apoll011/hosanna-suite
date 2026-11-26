// SPDX-License-Identifier: AGPL-3.0-only
import { createMemoryStorage } from "./adapters/memory.js";
import { createS3Storage } from "./adapters/s3.js";
import type { ObjectStorage } from "./types.js";

export type { S3StorageConfig } from "./adapters/s3.js";
export type {
  ListInput,
  ListResult,
  MultipartPart,
  MultipartPartUrlOptions,
  MultipartUpload,
  ObjectBody,
  ObjectMetadata,
  ObjectStorage,
  PresignedUrl,
  StoredObject,
  TenantObjectStorage,
  UploadInput,
  UrlOptions,
} from "./types.js";
export { StorageAccessDeniedError, StorageError, StorageNotFoundError } from "./types.js";
export { createMemoryStorage } from "./adapters/memory.js";
export { createS3Storage } from "./adapters/s3.js";

export type StorageConfig =
  { provider: "memory" } | ({ provider: "s3" } & import("./adapters/s3.js").S3StorageConfig);

export function createStorage(config?: StorageConfig): ObjectStorage {
  if (!config) {
    if (process.env.STORAGE_PROVIDER === "s3") {
      const bucket = process.env.S3_BUCKET;
      const region = process.env.S3_REGION ?? "us-east-1";
      if (!bucket) throw new Error("S3_BUCKET is required when STORAGE_PROVIDER=s3");
      return createS3Storage({
        bucket,
        region,
        ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
        ...(process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID } : {}),
        ...(process.env.S3_SECRET_ACCESS_KEY
          ? { secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
          : {}),
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      });
    }
    return createMemoryStorage();
  }
  return config.provider === "memory" ? createMemoryStorage() : createS3Storage(config);
}
