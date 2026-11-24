import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearLogosToolFactories,
  createLogosDomainTools,
  registerLogosToolFactory,
} from "../src/tools/factory.js";

describe("Logos tool factory", () => {
  it("filters a domain factory by surface", () => {
    clearLogosToolFactories();
    registerLogosToolFactory("finance.fund", () => [
      { name: "funds_search", description: "Search funds", inputSchema: {}, execute: () => ({}) },
      {
        name: "open_app",
        description: "Open app",
        inputSchema: {},
        execute: () => ({}),
        ui: true,
        apps: "suite",
      },
    ]);

    assert.deepEqual(
      createLogosDomainTools("finance.fund", "mcp").map((tool) => tool.name),
      ["funds_search"],
    );
    assert.deepEqual(
      createLogosDomainTools("finance.fund", "embedded", { appId: "finance", owningApp: "finance" }).map((tool) => tool.name),
      ["funds_search", "open_app"],
    );
    assert.deepEqual(
      createLogosDomainTools("finance.fund", "embedded", { appId: "auth", owningApp: "finance" }).map((tool) => tool.name),
      ["open_app"],
    );
  });
});
