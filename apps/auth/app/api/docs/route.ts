import { NextResponse } from "next/server";

const DOCS_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https: http:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://vercel.live",
].join("; ");

export function GET() {
  const html = `<!doctype html>
<html>
  <head>
    <title>Hosanna Auth API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="https://hosanna.live/favicon.ico" />
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": DOCS_CSP,
    },
  });
}
