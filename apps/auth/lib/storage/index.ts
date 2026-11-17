import { createStorage } from "@hosanna/storage";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const provider = process.env.STORAGE_PROVIDER;

if (process.env.NODE_ENV === "production" && !isProductionBuild && provider !== "s3") {
  throw new Error("Set STORAGE_PROVIDER=s3 for the Auth app");
}

if (
  provider === "s3" &&
  !isProductionBuild &&
  (!process.env.S3_ENDPOINT || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY)
) {
  throw new Error("Supabase S3 endpoint and access keys are required when STORAGE_PROVIDER=s3");
}

export const storage =
  provider === "s3"
    ? createStorage({
        provider: "s3",
        bucket: process.env.S3_BUCKET ?? "hosanna-assets",
        region: process.env.S3_REGION ?? "eu-west-1",
        ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
        ...(process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID } : {}),
        ...(process.env.S3_SECRET_ACCESS_KEY
          ? { secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
          : {}),
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      })
    : createStorage({ provider: "memory" });
