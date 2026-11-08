#!/usr/bin/env node
/**
 * Run tailwint (official Tailwind language-server fixer) in each app that uses Tailwind.
 * Must run with cwd = the app root so the LSP resolves that app's CSS @theme entry.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apps = ["apps/studio", "apps/saas"];
const timeoutMs = process.env.TAILWIND_FIX_TIMEOUT ?? "180000";
const bin = path.join(root, "node_modules", ".bin", "tailwint");

if (!fs.existsSync(bin)) {
  console.error(`Missing ${bin}. Run pnpm install from the repo root.`);
  process.exit(2);
}

let hardFail = false;

for (const app of apps) {
  const cwd = path.join(root, app);
  console.log(`\n→ tailwint --fix (${app})\n`);
  const result = spawnSync(
    bin,
    ["--fix", `--timeout=${timeoutMs}`, "src/**/*.{tsx,ts,jsx,js,css}"],
    {
      cwd,
      stdio: "inherit",
      env: process.env,
    },
  );
  const code = result.status ?? 2;
  if (code === 2) hardFail = true;
  if (code !== 0) console.warn(`tailwint exited ${code} in ${app}`);
}

process.exit(hardFail ? 2 : 0);
