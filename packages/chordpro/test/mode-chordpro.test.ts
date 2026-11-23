import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerChordproMode } from "../src/editor/mode-chordpro";

type AceRule = { token?: string | string[]; regex?: string | RegExp };
type HighlightRulesModule = {
  ChordproHighlightRules: new () => { $rules: Record<string, AceRule[]> };
};

const stubModules: Record<string, unknown> = {
  "ace/lib/oop": { inherits() {} },
  "ace/mode/text_highlight_rules": { TextHighlightRules: function TextHighlightRules() {} },
  "ace/mode/text": { Mode: function Mode() {} },
  "ace/mode/folding/fold_mode": { FoldMode: function FoldMode() {} },
  "ace/range": { Range: function Range() {} },
};

async function loadHighlightRules(): Promise<Record<string, AceRule[]>> {
  const exportsByName: Record<string, unknown> = {};
  const ace = {
    define(name: string, _deps: string[], factory: (...args: unknown[]) => void) {
      const exports: Record<string, unknown> = {};
      const require = (id: string) => stubModules[id] ?? exportsByName[id];
      factory(require, exports, { exports });
      exportsByName[name] = exports;
    },
  };

  await registerChordproMode(ace);

  const module = exportsByName["ace/mode/chordpro_highlight_rules"] as HighlightRulesModule;
  return new module.ChordproHighlightRules().$rules;
}

function countCapturingGroups(source: string): number {
  let count = 0;
  let inClass = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (char === "\\") {
      i += 1;
      continue;
    }
    if (inClass) {
      if (char === "]") inClass = false;
      continue;
    }
    if (char === "[") {
      inClass = true;
      continue;
    }
    if (char !== "(") continue;
    if (source[i + 1] !== "?") {
      count += 1;
      continue;
    }

    const isNamedGroup = source[i + 2] === "<" && source[i + 3] !== "=" && source[i + 3] !== "!";
    if (isNamedGroup) count += 1;
  }

  return count;
}

describe("chordpro Ace mode", () => {
  it("gives every tokenized rule as many tokens as capturing groups", async () => {
    const states = await loadHighlightRules();
    const violations: string[] = [];

    for (const [state, rules] of Object.entries(states)) {
      rules.forEach((rule, index) => {
        if (!Array.isArray(rule.token) || rule.regex === undefined) return;
        const source = typeof rule.regex === "string" ? rule.regex : rule.regex.source;
        const groups = countCapturingGroups(source);
        if (groups !== rule.token.length) {
          violations.push(`${state}[${index}]: ${rule.token.length} tokens, ${groups} groups`);
        }
      });
    }

    assert.deepEqual(violations, []);
  });

  it("highlights short start-of-block directives without a nested capturing group", async () => {
    const states = await loadHighlightRules();
    const shortBlockRule = states.start.find(
      (rule) =>
        typeof rule.regex === "string" &&
        rule.regex.includes("start_of_[a-z_]+|so(?:c|v|b|t|l|g|r|m|p|e)"),
    );

    assert.ok(shortBlockRule);
    const source = shortBlockRule.regex as string;
    assert.equal(countCapturingGroups(source), 3);

    const regex = new RegExp(source, "i");
    for (const directive of ["{soc}", "{sov}", "{sob}", "{soe}"]) {
      assert.equal(regex.test(directive), true, directive);
    }
  });
});
