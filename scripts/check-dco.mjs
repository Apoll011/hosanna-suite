// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const base = event.pull_request?.base?.sha;
const head = event.pull_request?.head?.sha ?? process.env.GITHUB_SHA;

if (!base || !head) {
  throw new Error("DCO check requires a pull request base and head commit.");
}

try {
  execFileSync("git", ["cat-file", "-e", `${base}:CONTRIBUTING.md`]);
} catch {
  console.log("DCO policy is not present on the target branch yet; skipping rollout commits.");
  process.exit(0);
}

const commits = execFileSync("git", ["rev-list", `${base}..${head}`], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);
const failures = [];

for (const commit of commits) {
  const [name, email, ...messageParts] = execFileSync(
    "git",
    ["show", "-s", "--format=%an%x00%ae%x00%B", commit],
    { encoding: "utf8" },
  ).split("\0");
  const message = messageParts.join("\0");
  const signoffs = [...message.matchAll(/^Signed-off-by:\s*(.+?)\s*<([^>]+)>\s*$/gim)];
  const authorName = name?.trim().toLocaleLowerCase();
  const authorEmail = email?.trim().toLocaleLowerCase();
  const hasAuthorSignoff = signoffs.some(
    ([, signedName, signedEmail]) =>
      signedName?.trim().toLocaleLowerCase() === authorName &&
      signedEmail?.trim().toLocaleLowerCase() === authorEmail,
  );

  if (!hasAuthorSignoff) failures.push(commit);
}

if (failures.length > 0) {
  console.error("Each pull request commit needs a matching author DCO sign-off:");
  for (const commit of failures) console.error(`- ${commit}`);
  process.exitCode = 1;
} else {
  console.log(`DCO sign-off verified for ${commits.length} commit(s).`);
}
