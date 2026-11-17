# Object storage

`@hosanna/storage` gives server-side applications one object API for AWS S3 and S3-compatible services. Applications select a provider at configuration time and use tenant-scoped handles; application code does not import AWS SDK types.

## Boundaries and key layout

```text
Auth / API ── ObjectStorage.forTenant(id) ── S3 adapter ── AWS S3 or compatible bucket
                                      └──── in-memory adapter for tests and local development
```

Every operation runs through `storage.forTenant(tenantId)`. Callers pass keys relative to that tenant. Providers prepend the validated tenant ID and reject traversal segments, so a caller cannot address another tenant by including `../` in a key. Tenant scoping is a storage namespace; applications still authenticate and authorize the caller before granting access.

The Auth app stores profile avatars under a user scope and church logos under an organization scope. The database stores stable URLs on the Auth host:

```text
/api/media/user/{userId}
/api/media/organization/{organizationId}
```

The media route maps each URL to one fixed object key, reads object metadata, and streams the body. The S3 bucket can remain private. These URLs are public image endpoints and should only be used for images intended to be visible to other signed-in or public product surfaces. Private documents must use an authorization check and short-lived download URLs instead.

Image uploads are normalized in Better Auth hooks before their user or organization records are written. Profile avatar deletion removes the stored avatar after the user update; removing a church logo removes the stored logo after the organization update.

## Package API

```ts
import { createStorage } from "@hosanna/storage";

const storage = createStorage();
const files = storage.forTenant(organizationId);

const stored = await files.upload({
  key: `songs/${songId}/score.pdf`,
  body: fileBytes,
  contentType: "application/pdf",
});

const metadata = await files.head(stored.key);
const stream = await files.download(stored.key);
const url = await files.createDownloadUrl(stored.key, {
  expiresInSeconds: 300,
  contentDisposition: 'attachment; filename="score.pdf"',
});
```

The tenant handle supports upload, Web and Node downloads, delete, batch delete, existence and metadata checks, prefix listing, copy, presigned upload/download URLs, and multipart upload lifecycle operations. Upload bodies accept `Uint8Array`, `Blob`, Web streams, and Node streams. Presigned results include the URL, HTTP method, required headers or form fields, and expiry time. S3 upload URLs use POST policies when `maxSizeBytes` is requested, so the size bound is enforced by the provider.

Provider errors become `StorageError` codes (`NOT_FOUND`, `ACCESS_DENIED`, `INVALID_INPUT`, `PROVIDER_ERROR`, and `UPLOAD_NOT_FOUND`). `head` returns `null` for a missing object. Keep provider SDKs and provider error values inside the adapter.

## Configuration

Local development and tests default to the in-memory adapter. Auth production requires `STORAGE_PROVIDER` to be explicitly set, preventing a production instance from silently storing uploads in process memory.

For S3 or an S3-compatible service, configure:

```dotenv
STORAGE_PROVIDER=s3
S3_BUCKET=hosanna-assets
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.example.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=true
```

`S3_ENDPOINT` and explicit credentials are optional for AWS S3 when the AWS credential provider chain is available. For MinIO, point `S3_ENDPOINT` to the local server and enable path-style access. Use the same bucket configuration for Auth and API processes that need to access shared objects. Avoid putting secrets in `.env.example` or source control.

The adapter defaults presigned URLs to 15 minutes. Set per-operation expiry where a shorter lifetime is appropriate. For S3-compatible services, confirm their endpoint, region, path-style behavior, and multipart limits with the provider.

## Multipart uploads

Start with `createMultipartUpload`, transfer numbered parts through `uploadMultipartPart` or `createMultipartPartUrl`, then submit the returned ETags to `completeMultipartUpload`. Abandoned uploads should be aborted; configure the bucket to expire incomplete multipart uploads. S3 requires non-final parts to be at least 5 MiB and limits an upload to 10,000 parts.

## Adding a provider

Implement `ObjectStorage` and `TenantObjectStorage`, prepend the validated tenant namespace for every object and multipart operation, and translate provider errors to the shared error codes. Run the shared contract in `packages/storage/test/contract.ts` against the new adapter. Keep SDK types out of the package's public interface.

## Verification

Run the memory contract and unit tests with:

```bash
pnpm --filter @hosanna/storage typecheck
pnpm --filter @hosanna/storage test
```

Set `S3_TEST_ENDPOINT`, `S3_TEST_BUCKET`, and optional `S3_TEST_REGION`, `S3_TEST_ACCESS_KEY_ID`, and `S3_TEST_SECRET_ACCESS_KEY` to run the same contract against MinIO or an S3-compatible service. Create the test bucket before running. The S3 integration suite is skipped when the required endpoint and bucket are absent.
