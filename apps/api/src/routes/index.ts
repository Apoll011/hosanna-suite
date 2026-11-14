import { Router } from "express";

import { cronRouter } from "./cron.routes.js";
import { folderRouter } from "./folder.routes.js";
import { healthRouter } from "./health.routes.js";
import { openapiRouter } from "./openapi.routes.js";
import { replicationRouter } from "./replication.routes.js";
import { serviceRouter } from "./service.routes.js";
import { songRouter } from "./song.routes.js";
import { songImportRouter } from "./songImport.routes.js";
import { trashRouter } from "./trash.routes.js";

import { authenticate } from "../middleware/auth.js";
import { apiLimiter, healthLimiter, syncLimiter } from "../middleware/rateLimit.js";
import { requireSubscription } from "../middleware/subscription.js";
import { cifraRouter } from "./cifra.routes.js";
import { annotationRouter } from "./serviceSongAnnotation.routes.js";
import { aiRouter } from "./ai.routes.js";
import { youtubeRouter } from "./youtube.routes.js";
import { rateLimit } from "express-rate-limit";

export const apiRouter = Router();

const aiChatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

apiRouter.use("/health", healthLimiter, healthRouter);
apiRouter.use("/cron", cronRouter);
apiRouter.use(openapiRouter);

apiRouter.use(authenticate);
apiRouter.use("/replication", syncLimiter, replicationRouter);

apiRouter.use("/songs/import", requireSubscription, apiLimiter, songImportRouter);
apiRouter.use("/songs", requireSubscription, apiLimiter, songRouter);
apiRouter.use("/folders", requireSubscription, apiLimiter, folderRouter);
apiRouter.use("/services", requireSubscription, apiLimiter, serviceRouter);
apiRouter.use("/cifra", requireSubscription, apiLimiter, cifraRouter);
apiRouter.use("/youtube", requireSubscription, apiLimiter, youtubeRouter);
apiRouter.use("/ai", requireSubscription, aiChatLimiter, aiRouter);

apiRouter.use("/trash", apiLimiter, trashRouter);
apiRouter.use("/annotation", apiLimiter, annotationRouter);
