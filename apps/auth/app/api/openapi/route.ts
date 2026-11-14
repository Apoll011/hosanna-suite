import { NextResponse } from "next/server";
import { buildAuthOpenApiDoc } from "@/lib/openapi";

export function GET() {
  return NextResponse.json(buildAuthOpenApiDoc(), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
