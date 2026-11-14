import { NextResponse } from "next/server";

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
    },
  });
}
