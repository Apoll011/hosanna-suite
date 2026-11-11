/**
 * Infra smoke checks: keep root scripts, turbo tasks, and CI tooling aligned.
 * Run: `pnpm test:workspace` (also invoked from CI).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function readText(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("workspace health", () => {
  it("root packageManager pnpm version matches CI setup", () => {
    const pkg = readJson("package.json");
    const match = /^pnpm@(.+)$/.exec(pkg.packageManager ?? "");
    assert.ok(match, "package.json packageManager must be pnpm@<version>");
    const version = match[1];

    const ci = readText(".github/workflows/ci.yml");
    assert.match(
      ci,
      new RegExp(`version:\\s*${version.replace(/\./g, "\\.")}`),
      `ci.yml pnpm version must match packageManager (${version})`,
    );
  });

  it("turbo.json exposes CI task graph entries", () => {
    const turbo = readJson("turbo.json");
    for (const task of ["build", "typecheck", "lint", "test", "db:generate"]) {
      assert.ok(turbo.tasks?.[task], `turbo.json missing task: ${task}`);
    }
  });

  it("root scripts used by developers and CI exist", () => {
    const scripts = readJson("package.json").scripts ?? {};
    for (const name of ["build", "typecheck", "lint", "test", "dev", "clean"]) {
      assert.ok(scripts[name], `package.json missing script: ${name}`);
    }
  });

  it("packages with a test script ship at least one *.test.ts", () => {
    const workspaces = ["apps", "packages"];
    const missing = [];

    for (const group of workspaces) {
      const groupDir = join(root, group);
      if (!existsSync(groupDir)) continue;
      for (const name of readdirSync(groupDir)) {
        const pkgPath = join(groupDir, name, "package.json");
        if (!existsSync(pkgPath)) continue;
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        if (!pkg.scripts?.test) continue;
        const testDir = join(groupDir, name, "test");
        const hasTests =
          existsSync(testDir) &&
          readdirSync(testDir, { recursive: true }).some((f) => String(f).endsWith(".test.ts"));
        if (!hasTests) missing.push(pkg.name ?? `${group}/${name}`);
      }
    }

    assert.deepEqual(missing, [], `test script without tests: ${missing.join(", ")}`);
  });
});
