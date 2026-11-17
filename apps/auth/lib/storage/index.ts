import { createStorage } from "@hosanna/storage";

if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && !process.env.STORAGE_PROVIDER) {
  throw new Error("STORAGE_PROVIDER must be configured for the Auth app");
}

export const storage = createStorage();
