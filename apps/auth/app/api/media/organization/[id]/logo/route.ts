// SPDX-License-Identifier: AGPL-3.0-only
import { auth } from "@/lib/auth/server";
import { authImages } from "@/lib/storage/auth-images";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id || id.includes("/"))
    return Response.json({ error: "Invalid organization" }, { status: 400 });

  try {
    await auth.api.updateOrganization({
      headers: request.headers,
      body: { organizationId: id, data: {} },
    });
  } catch {
    return Response.json({ error: "Organization update is not allowed" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > 15 * 1024 * 1024)
    return Response.json({ error: "Image exceeds the 10 MB limit" }, { status: 413 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("image" in body) || typeof body.image !== "string") {
    return Response.json({ error: "Image data is required" }, { status: 400 });
  }

  try {
    const logoUrl = await authImages.uploadOrganizationLogo(id, body.image);
    return Response.json({ logoUrl });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not store image" },
      { status: 400 },
    );
  }
}
