#!/usr/bin/env node
/**
 * Resolve which Cloudflare apps to deploy for the current branch/stage.
 *
 * Env:
 *   GITHUB_REF_NAME, GITHUB_EVENT_NAME, GITHUB_EVENT_BEFORE, GITHUB_SHA
 *   INPUT_APP (optional workflow_dispatch filter)
 *   CONFIG_PATH (default: .github/deploy-apps.json)
 *
 * Writes GITHUB_OUTPUT keys: matrix (JSON array), deploy ("true"|"false"), stage
 */
import { execSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const STAGE_BY_BRANCH = {
  develop: "dev",
  main: "prod",
  master: "prod",
};

const GITHUB_ENVIRONMENT_BY_STAGE = {
  dev: "Preview",
  prod: "Production",
};

function matchGlob(file, pattern) {
  const re = new RegExp(
    `^${pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "\0")
      .replace(/\*/g, "[^/]*")
      .replace(/\0/g, ".*")}$`,
  );
  return re.test(file);
}

function pathMatched(file, patterns) {
  return patterns.some((p) => matchGlob(file, p));
}

function changedFiles() {
  const before = process.env.GITHUB_EVENT_BEFORE;
  const sha = process.env.GITHUB_SHA;
  if (!before || !sha || /^0+$/.test(before)) return null;
  try {
    const out = execSync(`git diff --name-only ${before} ${sha}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    // Missing before SHA (shallow clone / force-push) → deploy all stage apps
    return null;
  }
}

function appendOutput(key, value) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) {
    console.log(`OUTPUT ${key}=${value}`);
    return;
  }
  const delim = `EOF_${key}_${Date.now()}`;
  appendFileSync(out, `${key}<<${delim}\n${value}\n${delim}\n`);
}

const configPath = resolve(
  process.env.CONFIG_PATH || ".github/deploy-apps.json",
);
const config = JSON.parse(readFileSync(configPath, "utf8"));
const branch = process.env.GITHUB_REF_NAME || "";
const event = process.env.GITHUB_EVENT_NAME || "";
const appFilter = (process.env.INPUT_APP || "").trim();
const stage = STAGE_BY_BRANCH[branch];

if (!stage) {
  console.log(`No deploy stage for branch "${branch}" — skipping.`);
  appendOutput("matrix", "[]");
  appendOutput("deploy", "false");
  appendOutput("stage", "");
  process.exit(0);
}

const files = event === "workflow_dispatch" ? null : changedFiles();
const githubEnvironment = GITHUB_ENVIRONMENT_BY_STAGE[stage];
const matrix = [];

for (const app of config.apps) {
  if (appFilter && app.id !== appFilter) continue;
  const target = app.targets?.[stage];
  if (!target) continue;

  const changed = files === null || files.some((f) => pathMatched(f, app.paths));
  if (!changed) {
    console.log(`skip ${app.id}: no matching path changes`);
    continue;
  }

  matrix.push({
    id: app.id,
    package: app.package,
    dir: app.dir,
    target: stage,
    url: target.url,
    wranglerEnv: target.wranglerEnv || "",
    githubEnvironment,
  });
}

console.log(`stage=${stage} matrix=${JSON.stringify(matrix)}`);
appendOutput("matrix", JSON.stringify(matrix));
appendOutput("deploy", matrix.length > 0 ? "true" : "false");
appendOutput("stage", stage);
