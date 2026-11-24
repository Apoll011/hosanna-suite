import { DOMAIN_PACKS } from "../domains/packs.js";

function names(packId: string): string[] {
  return DOMAIN_PACKS.find((pack) => pack.id === packId)?.tools.map((tool) => tool.name) ?? [];
}

export const STUDIO_ONLY_TOOLS = [
  "studio_sync",
  "studio_navigate",
  "studio_generate_pdf",
  "studio_search",
  "open_app",
] as const;

export const MCP_TOOL_GROUPS = {
  discovery: [...names("platform.discovery"), ...names("platform.org")],
  chordpro: names("platform.chordpro"),
  songs: names("music.song"),
  services: names("music.service"),
  library: names("library"),
} as const;

export const ALL_MCP_TOOL_NAMES: string[] = Object.values(MCP_TOOL_GROUPS).flat();

export const TOOL_SURFACE = {
  core: "Registered on the Hosanna MCP server — available to external AI clients (ChatGPT, Claude, …).",
  studioOnly:
    "Available only inside Hosanna embedded chat (Studio, Auth, …) — UI navigation, open_app, PDF, search, and live sync. Not exposed via MCP.",
} as const;
