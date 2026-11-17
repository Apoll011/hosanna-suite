import type { ObjectStorage } from "@hosanna/storage";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type ParsedImage = { contentType: string; bytes: Uint8Array };

export function createAuthImageStorage(storage: ObjectStorage, authUrl: string) {
  const baseUrl = authUrl.replace(/\/+$/, "");
  const upload = async (kind: "user" | "organization", id: string, value: string): Promise<string> => {
    const parsed = isBase64Image(value) ? parseImage(value) : await fetchImage(value);
    const tenant = storage.forTenant(`${kind}-${id}`);
    await tenant.upload({ key: kind === "user" ? "avatar" : "logo", body: parsed.bytes, size: parsed.bytes.byteLength, contentType: parsed.contentType });
    return imageUrl(kind, id);
  };
  const remove = async (kind: "user" | "organization", id: string) => {
    await storage.forTenant(`${kind}-${id}`).delete(kind === "user" ? "avatar" : "logo");
  };
  const imageUrl = (kind: "user" | "organization", id: string) => `${baseUrl}/api/media/${kind}/${encodeURIComponent(id)}`;

  return {
    isBase64Image,
    isExternalImageUrl: (value: string) => isExternalImageUrl(value, baseUrl),
    uploadBase64Avatar: (userId: string, value: string) => upload("user", userId, value),
    uploadUrlAvatar: (userId: string, value: string) => upload("user", userId, value),
    deleteAvatar: (userId: string) => remove("user", userId),
    uploadOrganizationLogo: (organizationId: string, value: string) => upload("organization", organizationId, value),
    deleteOrganizationLogo: (organizationId: string) => remove("organization", organizationId),
    imageUrl,
  };
}

export function isBase64Image(value: string): boolean {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value) || /^[A-Za-z0-9+/=]{100,}$/.test(value);
}

export function isExternalImageUrl(value: string, authUrl: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const base = new URL(authUrl);
    return url.origin !== base.origin || !url.pathname.startsWith("/api/media/");
  } catch {
    return false;
  }
}

function parseImage(value: string): ParsedImage {
  const dataUri = value.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  const contentType = dataUri?.[1] ?? "image/png";
  const payload = dataUri?.[2] ?? value;
  const bytes = new Uint8Array(Buffer.from(payload, "base64"));
  validateImage(contentType, bytes.byteLength);
  return { contentType, bytes };
}

async function fetchImage(url: string): Promise<ParsedImage> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!contentType.startsWith("image/")) throw new Error("Image URL did not return an image");
  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength > MAX_IMAGE_BYTES) throw new Error("Image exceeds the 10 MB limit");
  const bytes = new Uint8Array(await response.arrayBuffer());
  validateImage(contentType, bytes.byteLength);
  return { contentType, bytes };
}

function validateImage(contentType: string, size: number) {
  if (!contentType.startsWith("image/")) throw new Error("Unsupported image content type");
  if (size === 0 || size > MAX_IMAGE_BYTES) throw new Error("Image must be between 1 byte and 10 MB");
}
