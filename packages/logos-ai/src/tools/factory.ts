/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type LogosToolSurface = "embedded" | "mcp";
import type { SuiteAppId } from "@hosanna/auth";
import type { LogosCapability } from "../kernel/capabilities.js";

export type { SuiteAppId } from "@hosanna/auth";

export type LogosToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema: unknown;
  /** Permission enforced (MCP + embedded) before execute, e.g. "fund.update". */
  permission?: string;
  /** Require an active/trialing subscription before execute. */
  requiresEntitlement?: boolean;
  execute: (input: unknown) => unknown | Promise<unknown>;
  surfaces?: readonly LogosToolSurface[];
  apps?: readonly SuiteAppId[] | "suite";
  ui?: true;
  requiresCapabilities?: readonly LogosCapability[];
};

export type LogosToolFactoryContext = {
  surface: LogosToolSurface;
  appId?: SuiteAppId;
  owningApp?: SuiteAppId;
  capabilities?: readonly LogosCapability[];
  [key: string]: unknown;
};

export type LogosToolFactory = (context: LogosToolFactoryContext) => readonly LogosToolDefinition[];

const toolFactories = new Map<string, LogosToolFactory>();

export function registerLogosToolFactory(domainId: string, factory: LogosToolFactory): void {
  if (toolFactories.has(domainId)) {
    throw new Error(`Logos tool factory already registered: ${domainId}`);
  }
  toolFactories.set(domainId, factory);
}

export function clearLogosToolFactories(): void {
  toolFactories.clear();
}

export function createLogosDomainTools(
  domainId: string,
  surface: LogosToolSurface,
  context: Omit<LogosToolFactoryContext, "surface"> = {},
): LogosToolDefinition[] {
  const factory = toolFactories.get(domainId);
  if (!factory) return [];
  return factory({ ...context, surface }).filter((definition) => {
    if (definition.ui && surface !== "embedded") return false;
    if (definition.surfaces && !definition.surfaces.includes(surface)) return false;
    const capabilities = Array.isArray(context.capabilities) ? context.capabilities : [];
    if (definition.requiresCapabilities?.some((capability) => !capabilities.includes(capability))) {
      return false;
    }
    if (surface === "embedded") {
      const apps = definition.apps ?? context.owningApp;
      const allowed =
        apps === "suite" ||
        (Array.isArray(apps) ? apps.includes(context.appId) : apps === context.appId);
      if (!allowed) return false;
    }
    return true;
  });
}

export function createLogosToolFactory(factories: readonly LogosToolFactory[]): LogosToolFactory {
  return (context) => factories.flatMap((factory) => [...factory(context)]);
}
