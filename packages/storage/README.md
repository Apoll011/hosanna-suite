# @hosanna/storage

Provider-independent, tenant-scoped object storage for server-side Hosanna code. AWS SDK types and errors stay inside the package.

## Usage

```ts
import { createStorage } from "@hosanna/storage";

const storage = createStorage();
const files = storage.forTenant(organizationId);

const object = await files.upload({
  key: `songs/${songId}/score.pdf`,
  body: fileBytes,
  contentType: "application/pdf",
});
const stream = await files.download(object.key);
const download = await files.createDownloadUrl(object.key, {
  expiresInSeconds: 300,
  contentDisposition: 'attachment; filename="score.pdf"',
});
```

Keys passed to a tenant handle are relative to that tenant. The adapter stores them under a validated tenant prefix. Keep authorization in the application: a tenant handle is a storage namespace, not proof that the caller belongs to that tenant.

`download` returns a Web `ReadableStream`; `downloadNode` returns a Node `Readable`. Upload bodies accept `Uint8Array`, `Blob`, Web streams, and Node streams. `head` returns `null` when the object is missing; `exists` is a convenience wrapper. Errors use `StorageError` and stable codes such as `NOT_FOUND`, `ACCESS_DENIED`, and `PROVIDER_ERROR`.

## Providers

`createStorage({ provider: "memory" })` creates an in-memory adapter for tests and local development. With no explicit config, `createStorage()` selects S3 when `STORAGE_PROVIDER=s3`; otherwise it selects memory.

S3 configuration supports AWS S3 and compatible endpoints such as MinIO, Cloudflare R2, and Backblaze B2:

```ts
const storage = createStorage({
  provider: "s3",
  bucket: process.env.S3_BUCKET!,
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  forcePathStyle: true,
});
```

For AWS, omit endpoint and let the AWS credential provider chain resolve credentials. For S3-compatible services, configure their endpoint, credentials, region, and path-style setting as required by the service.

Environment configuration uses `STORAGE_PROVIDER`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_FORCE_PATH_STYLE=true`.

## Presigned URLs

URL methods return `{ url, method, headers, fields, expiresAt }`. PUT URLs include required headers. If `maxSizeBytes` is specified for an upload URL, S3 returns a POST policy with a size range; submit it as `multipart/form-data` using the returned fields. Without a size limit, S3 returns a PUT URL. Download URLs use GET. Expiry defaults to 15 minutes and can be configured per operation or in the S3 adapter config.

## Multipart uploads

Use `createMultipartUpload`, upload each numbered part with `uploadMultipartPart` or a `createMultipartPartUrl` URL, then pass the returned ETags to `completeMultipartUpload`. Call `abortMultipartUpload` when the upload is abandoned. S3 requires non-final parts to be at least 5 MiB and allows at most 10,000 parts. The application should set lifecycle cleanup for incomplete multipart uploads in the bucket.

## Adding a provider

Implement `ObjectStorage` and return tenant handles implementing `TenantObjectStorage`. Prefix every object and multipart operation with the validated tenant ID, translate provider failures to `StorageError` codes, and run the shared contract suite in `test/contract.ts` against the implementation. Avoid exposing provider SDK values from this package's public API.

## Tests

`pnpm --filter @hosanna/storage test` runs in-memory unit and contract tests. The same contract runs against MinIO or another S3-compatible server when `S3_TEST_BUCKET` and `S3_TEST_ENDPOINT` are set. Optional credentials are `S3_TEST_ACCESS_KEY_ID`, `S3_TEST_SECRET_ACCESS_KEY`, and `S3_TEST_REGION`. Create the bucket before running the integration suite.
