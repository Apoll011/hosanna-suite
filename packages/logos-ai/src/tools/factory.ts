/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LogosToolSurface = "embedded" | "mcp";

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
};

export type LogosToolFactoryContext = {
  surface: LogosToolSurface;
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
  return factory({ ...context, surface }).filter(
    (definition) => !definition.surfaces || definition.surfaces.includes(surface),
  );
}

export function createLogosToolFactory(factories: readonly LogosToolFactory[]): LogosToolFactory {
  return (context) => factories.flatMap((factory) => [...factory(context)]);
}
