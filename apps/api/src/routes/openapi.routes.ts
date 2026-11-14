import { Router } from "express";
import { buildApiOpenApiDoc } from "../openapi/index.js";

export const openapiRouter = Router();

openapiRouter.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.json(buildApiOpenApiDoc());
});

openapiRouter.get("/docs", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
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
