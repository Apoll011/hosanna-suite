#!/usr/bin/env node
/**
 * Resolve which Cloudflare apps to deploy for the current branch/stage.
 *
 * Change detection (no hand-maintained path lists):
 *   - app dir (apps/<id>/**)
 *   - transitive @hosanna/* workspace deps from that app's package.json
 *   - fixed root files: pnpm-lock.yaml, pnpm-workspace.yaml
 *
 * Env:
 *   GITHUB_REF_NAME, GITHUB_EVENT_NAME, GITHUB_EVENT_BEFORE, GITHUB_SHA
 *   INPUT_APP (optional workflow_dispatch filter)
 *   CONFIG_PATH (default: .github/deploy-apps.json)
 *
 * Writes GITHUB_OUTPUT keys: matrix (JSON array), deploy ("true"|"false"), stage
 */
import { execSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());

const STAGE_BY_BRANCH = {
  develop: "dev",
  main: "prod",
  master: "prod",
};

const GITHUB_ENVIRONMENT_BY_STAGE = {
  dev: "Preview",
  prod: "Production",
};

/** Always invalidate every deployable app when these change. */
const FIXED_PATHS = ["pnpm-lock.yaml", "pnpm-workspace.yaml"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function workspacePackageMap() {
  const map = new Map();
  for (const group of ["apps", "packages"]) {
    const base = join(ROOT, group);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkgPath = join(base, entry.name, "package.json");
      if (!existsSync(pkgPath)) continue;
      const { name } = readJson(pkgPath);
      if (name) map.set(name, `${group}/${entry.name}`);
    }
  }
  return map;
}

function workspaceDepsOf(dir, packageMap) {
  const pkgPath = join(ROOT, dir, "package.json");
  if (!existsSync(pkgPath)) return [];
  const pkg = readJson(pkgPath);
  const names = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ]);
  return [...names].filter((n) => packageMap.has(n));
}

/** Transitive closure of workspace packages reachable from appDir. */
function resolveWatchDirs(appDir, packageMap) {
  const dirs = new Set([appDir]);
  const queue = [...workspaceDepsOf(appDir, packageMap)];
  const seenPkgs = new Set();

  while (queue.length) {
    const name = queue.shift();
    if (seenPkgs.has(name)) continue;
    seenPkgs.add(name);
    const dir = packageMap.get(name);
    if (!dir) continue;
    dirs.add(dir);
    queue.push(...workspaceDepsOf(dir, packageMap));
  }

  return [...dirs];
}

function watchPatternsFor(appDir, packageMap) {
  const dirs = resolveWatchDirs(appDir, packageMap);
  return [...dirs.map((d) => `${d}/**`), ...FIXED_PATHS];
}

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
const config = readJson(configPath);
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

const packageMap = workspacePackageMap();
const files = event === "workflow_dispatch" ? null : changedFiles();
const githubEnvironment = GITHUB_ENVIRONMENT_BY_STAGE[stage];
const matrix = [];

for (const app of config.apps) {
  if (appFilter && app.id !== appFilter) continue;
  const target = app.targets?.[stage];
  if (!target) continue;

  const patterns = watchPatternsFor(app.dir, packageMap);
  console.log(`${app.id} watched paths:`);
  for (const p of patterns) console.log(`  - ${p}`);

  const changed = files === null || files.some((f) => pathMatched(f, patterns));
  if (!changed) {
    console.log(`skip ${app.id}: no matching path changes`);
    continue;
  }

  console.log(`deploy ${app.id}`);
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
