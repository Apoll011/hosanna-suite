import { Router } from "express";
import { buildApiOpenApiDoc } from "../openapi/index.js";

export const openapiRouter = Router();

openapiRouter.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.json(buildApiOpenApiDoc());
});

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

openapiRouter.get("/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Security-Policy", DOCS_CSP);
  res.send(`<!doctype html>
<html>
  <head>
    <title>Hosanna API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="https://hosanna.live/favicon.ico" />
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`);
});
