import { NextResponse } from "next/server";
import { buildAuthOpenApiDoc } from "@/lib/openapi";
import { auth } from "@/lib/auth/server";

export async function GET() {
  const baseDoc = buildAuthOpenApiDoc();

  try {
    const betterAuthDoc = await (auth.api as any).generateOpenAPISchema?.();
    if (betterAuthDoc?.paths) {
      const betterAuthPaths: Record<string, any> = {};
      for (const [path, op] of Object.entries(betterAuthDoc.paths)) {
        const fullPath = path.startsWith("/api/auth")
          ? path.replace(/^\/api/, "")
          : `/auth${path.startsWith("/") ? path : `/${path}`}`;
        betterAuthPaths[fullPath] = op;
      }

      return NextResponse.json(
        {
          ...baseDoc,
          paths: {
            ...betterAuthPaths,
            ...baseDoc.paths,
          },
          components: {
            ...baseDoc.components,
            schemas: {
              ...(betterAuthDoc.components?.schemas || {}),
              ...baseDoc.components.schemas,
            },
          },
        },
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        },
      );
    }
  } catch (err) {
    console.error("[openapi] Failed to generate Better Auth OpenAPI schema:", err);
  }

  return NextResponse.json(baseDoc, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
