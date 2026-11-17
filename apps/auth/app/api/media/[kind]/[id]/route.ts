import { StorageError } from "@hosanna/storage";
import { storage } from "@/lib/storage";

type RouteContext = { params: Promise<{ kind: string; id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { kind, id } = await params;
  if ((kind !== "user" && kind !== "organization") || !id || id.includes("/")) {
    return new Response(null, { status: 404 });
  }

  const objects = storage.forTenant(`${kind}-${id}`);
  const key = kind === "user" ? "avatar" : "logo";
  try {
    const metadata = await objects.head(key);
    if (!metadata) return new Response(null, { status: 404 });
    const body = await objects.download(key);
    return new Response(body, {
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=3600",
        "content-type": metadata.contentType ?? "application/octet-stream",
        "x-content-type-options": "nosniff",
        ...(metadata.size ? { "content-length": String(metadata.size) } : {}),
      },
    });
  } catch (error) {
    if (error instanceof StorageError && error.code === "NOT_FOUND")
      return new Response(null, { status: 404 });
    throw error;
  }
}
