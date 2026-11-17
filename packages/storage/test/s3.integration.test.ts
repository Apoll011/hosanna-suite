import { describe } from "node:test";
import { createS3Storage } from "../src/index.js";
import { runStorageContract } from "./contract.js";

const bucket = process.env.S3_TEST_BUCKET;
const endpoint = process.env.S3_TEST_ENDPOINT;

if (bucket && endpoint) {
  const storage = createS3Storage({
    bucket,
    endpoint,
    region: process.env.S3_TEST_REGION ?? "us-east-1",
    ...(process.env.S3_TEST_ACCESS_KEY_ID
      ? { accessKeyId: process.env.S3_TEST_ACCESS_KEY_ID }
      : {}),
    ...(process.env.S3_TEST_SECRET_ACCESS_KEY
      ? { secretAccessKey: process.env.S3_TEST_SECRET_ACCESS_KEY }
      : {}),
    forcePathStyle: true,
  });
  runStorageContract("S3", () => storage);
} else {
  describe(
    "S3 integration",
    {
      skip: "Set S3_TEST_BUCKET and S3_TEST_ENDPOINT to run against MinIO or S3-compatible storage",
    },
    () => {},
  );
}
