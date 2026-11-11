# MCP Domain Packs — how it works & how to expand

This is the guide for adding a new product surface to Hosanna AI (MCP + Logos): tools, permissions, discovery, and chat proposals.

**Audience:** engineers adding domains (Finance funds, Presenter cues, …) without touching every host app.

---

## 1. Mental model

A **domain** is one product surface. It is registered in three places that share the same id:

| Layer | What it owns | Example |
| ----- | ------------ | ------- |
| **Auth domain** (`@hosanna/auth`) | `DomainId`, permission resource (`song`), suite app owner | `music.song` → `song.*` |
| **MCP Domain Pack** (`apps/api/src/mcp/domains/`) | Tools, permission gates, resources, prompts, skills | `music.song` pack → `songs_*` tools |
| **Logos Resource** (`@hosanna/logos-ai`) | Proposal/edit kind in chat (`song` / `service`) | `domainId: "music.song"` |

```
┌─────────────────────────────────────────────────────────────┐
│  Auth DOMAINS          MCP Domain Packs       Logos Resource │
│  music.song      ↔     music.song       ↔     kind: song     │
│  music.service   ↔     music.service    ↔     kind: service  │
│  (finance.fund)  ↔     (finance.fund)   ↔     (kind: fund)   │  ← future
└─────────────────────────────────────────────────────────────┘
```

**Hosts** (Studio, Auth, future Finance app) only declare:

- a **profile** (capabilities: navigate, print, …)
- a **catalog** (how to load/patch songs, services, …)

They do **not** re-implement song/service/fund tools. New domains should not require edits to every Logos mount — only optional catalog handlers if that host should Accept proposals for the new kind.

---

## 2. How a tool call works (end-to-end)

There are two entry points. Both hit the same domain logic and permissions; only the transport differs.

### A. Logos chat (Studio / Auth embedded AI)

```
User message
    │
    ▼
Logos useChatStream  ──POST──►  /api/ai/chat  (aiChat.service)
    │                              │
    │                              ├─ streamText (Vercel AI SDK)
    │                              ├─ tools: { songs_propose_edit, … }
    │                              │     └─ requirePermission / services
    │                              ▼
    │                         tool result JSON in stream
    ▼
parseToolActions(toolName, output)
    │
    ├─ propose  → stage in proposal tray (Accept / Decline in chat)
    ├─ confirm  → confirm card (e.g. delete)
    ├─ navigate / print → HostActionCard on thin hosts; local on Studio
    └─ openApp / sync → host bridge
```

Example: “transpose Amazing Grace to G”

1. Model calls `hosanna_permissions` / `hosanna_capabilities` (optional but encouraged).
2. Model calls `songs_search` → then `songs_propose_transpose`.
3. Tool handler: `requireMcpContext` → `requirePermission(ctx, "song.update")` → builds proposal JSON.
4. Stream event reaches Logos → `parseToolActions` → `dispatchLogosActions` → proposal tray.
5. User **Accepts** in chat → catalog `patch` (HTTP or in-memory adapter) persists content.
6. Optional **Open** → Music/Studio path for that `domainId` / kind.

### B. External MCP (ChatGPT / Claude / …)

```
MCP client
    │
    ▼
POST /mcp  (mcp/http.ts)
    │
    ├─ mcpAuthMiddleware  → Bearer / OAuth → McpContext on authInfo
    ▼
createHosannaMcpServer(authInfo)
    │
    └─ wireHosannaDomainPacks(server, authInfo)
           └─ registerSongTools / registerServiceTools / …
                 └─ same requirePermission + services as aiChat
```

Studio-only tools (`studio_navigate`, `open_app`, …) are **not** on the MCP server — they exist only on the embedded assistant tool set in `aiChat.service`.

### External AI + propose — no Logos provider

**Logos is only the Hosanna embedded chat UI.** ChatGPT / Claude / other MCP clients never load a Logos provider, proposal tray, or Accept/Decline cards.

What `songs_propose_*` / `services_propose_*` actually do on MCP:

1. **Server builds a proposal JSON** (content, diff, validation, `updatedAt`, …) and returns it to the model. **Nothing is written** to the org library.
2. The **external model** is instructed (skills + tool `next` hints) to **show that proposal to the human in the MCP chat** and wait for explicit approval.
3. Only after the user says yes does the model call **`songs_save` / `services_save`** with the proposal fields — that is the persist step for MCP hosts.

So the “Accept” UX for external AI is **conversational approval + `*_save`**, not a Logos card.

| Surface | Propose | Persist |
| ------- | ------- | ------- |
| **Logos** (Studio / Auth) | Tray / Accept–Decline in chat; optional Open | Catalog patch (or Studio editor Save) — usually **not** `songs_save` |
| **External MCP** | Model shows proposal text/JSON in ChatGPT/Claude | Model calls `songs_save` / `services_save` after user OK |

There is no automatic “install Logos into ChatGPT.” If you ever want Hosanna-native Accept UI for an external session, that would be a separate product (e.g. deep-link into Auth/Studio with a staged proposal) — not how MCP works today.

### Permission gate (both paths)

```ts
requirePermission(ctx, "song.update");  // throws if role lacks it
requireWriteEntitlement(ctx);         // paid plan for writes
```

Discovery tools advertise what the **current role** can actually call:

- `hosanna_capabilities` → `domains[].tools[].allowed`
- `hosanna_permissions` → `permissions` / `denied` + `tools.allowed` / `tools.denied`

So the model should prefer tools marked `allowed: true` and not invent fund/write flows the user cannot run.

---

## 3. What changed (Domain Packs work)

Previously: add a tools file, manually call `registerX` in `server.ts`, hardcode song/service permission lists in discovery, and teach every Logos host about new proposal kinds.

Now:

| Piece | Role |
| ----- | ---- |
| `packages/auth/.../domains.ts` | Canonical `DomainId` + Logos kind mapping |
| `packages/auth/.../appRoles.ts` | Per-app role scaffold (`finance.treasurer` → permissions) — empty until products ship |
| `apps/api/src/mcp/domains/packs.ts` | Pack metadata: tools + permission gates + resources/prompts/skills |
| `apps/api/src/mcp/domains/wire.ts` | Mounts tool/prompt/resource modules onto the MCP server |
| `apps/api/src/mcp/domains/discovery.ts` | Permission-aware views for capabilities/permissions |
| `apps/api/src/mcp/server.ts` | Only calls `wireHosannaDomainPacks` |
| Logos `ResourceDefinition.domainId` | Aligns chat resources with pack ids (`music.song`) |

**Unchanged on purpose:** Better Auth permission strings stay `{resource}.{action}` (`song.update`). `DomainId` is the **product grouping**, not a rename of every permission string.

---

## 4. File map

```
packages/auth/src/authorization/
  permission.ts      # statement + PermissionString
  domains.ts         # DomainId, DOMAINS, helpers
  appRoles.ts        # APP_ROLE_PERMISSIONS, resolveEffectivePermissions
  roles.ts           # org roles (owner, guest, …)

apps/api/src/mcp/
  server.ts          # createHosannaMcpServer → wireHosannaDomainPacks
  domains/
    types.ts         # DomainPack, McpToolGate
    registry.ts      # registerDomainPack, listDomainPacks, …
    packs.ts         # DOMAIN_PACKS metadata
    discovery.ts     # summarizeDomainsForUser, permissionsReportForUser
    wire.ts          # sync mount of register*Tool modules
    index.ts
  tools/             # songs.ts, services.ts, library.ts, …
  lib/toolCatalog.ts # authoritative tool name lists (contract tests)
  resources/         # hosanna:// MCP resources
  prompts/           # MCP prompts

packages/logos-ai/src/resources/
  types.ts           # ResourceDefinition + domainId
  song.ts / service.ts
  registry.ts        # getResource, getResourceByDomainId, registerResource
```

MCP markdown skills/docs (served as `hosanna://…`): `apps/api/docs/mcp/`.

---

## 5. How to expand — checklist

Use this when adding a real domain (example names: `fund`, domain id `finance.fund`).

### Step 0 — Decide the shape

- **Permission resource:** e.g. `fund` with actions `access | create | update | delete`
- **DomainId:** e.g. `finance.fund`
- **Suite app:** `finance`
- **Logos kind** (only if chat proposals/Accept): e.g. `fund`
- **App role** (optional): e.g. `finance.treasurer` → subset of `fund.*`

### Step 1 — Auth permissions + domain

1. Add the resource/actions to `statement` in `packages/auth/src/authorization/permission.ts`.
2. Grant them on the right org roles in `roles.ts`.
3. Add a `DomainDefinition` to `DOMAINS` in `domains.ts` (`id`, `permissionResource`, `app`, optional `logosKind`).
4. If needed, add `APP_ROLE_PERMISSIONS["finance.treasurer"] = [...]` in `appRoles.ts`.
5. Build/test `@hosanna/auth`.

### Step 2 — MCP tools module

1. Create `apps/api/src/mcp/tools/funds.ts` with `registerFundTools(server, authInfo)`.
2. Inside each tool: `requireMcpContext` → `requirePermission(ctx, "fund.…")` → (writes) `requireWriteEntitlement`.
3. Follow existing patterns: draft/propose first, `funds_save` only after approval; return JSON via `jsonResult`.

### Step 3 — Tool catalog + Domain Pack

1. Add tool names to `MCP_TOOL_GROUPS` in `lib/toolCatalog.ts` (contract tests assert uniqueness / coverage).
2. In `domains/packs.ts`, append a pack:

```ts
{
  id: "finance.fund",
  title: "Funds",
  logosKind: "fund", // when Logos supports it
  permissions: permissionsForDomain("finance.fund"),
  tools: [ /* { name, permission, requiresEntitlement? } */ ],
  resources: ["hosanna://domain/funds"],
  prompts: ["funds_create", …],
  skills: ["hosanna://skills/funds-safe-edit"],
}
```

3. In `domains/wire.ts`, call `registerFundTools(server, authInfo)` (and prompts if any).
4. Extend `DomainId` / `logosKind` types if you introduced new literals.

Discovery (`hosanna_capabilities` / `hosanna_permissions`) picks up the pack automatically — **do not** hardcode a new permission list in discovery tools.

### Step 4 — Docs / skills (optional but recommended)

1. `apps/api/docs/mcp/domain-funds.md` → expose as `hosanna://domain/funds`.
2. Skill under `apps/api/docs/mcp/skills/.../SKILL.md`.
3. Register resource URIs in the resources catalog / pack `resources` list.

### Step 5 — Logos (only if chat Accept/Decline)

1. Add catalog kind + handlers (`CatalogResourceKind`, HTTP routes if needed).
2. Add `fundResource` with `domainId: "finance.fund"` and `registerResource(fundResource)`.
3. Proposal card / extractProposal convention (same shape as song/service: tool returns `{ proposal: { … } }`).
4. Thin Finance host: `createLogosHost` + catalog; Auth/Studio only get handlers if they should Accept funds too.

### Step 6 — Embedded aiChat tools

The Studio/Auth assistant tool map lives in `aiChat.service.ts` and is **parallel** to MCP registration today. When you add MCP tools that Logos chat must call, also register the matching `tool({ … })` entries there (or a shared factory — prefer sharing when you touch this path). Studio-only UI tools stay here only.

### Step 7 — Tests

- Auth: domain + role permission tests.
- API: pack covers every `ALL_MCP_TOOL_NAMES` entry (`test/mcp/domains.test.ts`).
- Logos: `domainId` / `getResourceByDomainId` if you added a resource.
- Contract: `test/mcp/contract.test.ts` still passes.

---

## 6. Domain Pack API (reference)

```ts
type McpToolGate = {
  name: string;
  permission?: PermissionString;   // omit = always “allowed” in discovery
  requiresEntitlement?: boolean; // documentation / future filtering
};

type DomainPack = {
  id: DomainId | string;
  title: string;
  logosKind?: "song" | "service"; // extend when new Logos kinds exist
  permissions: readonly PermissionString[];
  tools: readonly McpToolGate[];
  resources?: readonly string[];
  prompts?: readonly string[];
  skills?: readonly string[];
  register?: (server, authInfo?) => void; // optional; mounting is in wire.ts
};
```

Helpers:

| Function | Use |
| -------- | --- |
| `ensureDomainPacksRegistered()` | Publish metadata into the registry |
| `wireHosannaDomainPacks(server, auth)` | Mount all tools/prompts/resources |
| `summarizeDomainsForUser(user)` | Capabilities `domains` payload |
| `permissionsReportForUser({ orgRole, appRoles })` | Permissions + tool allow/deny |
| `assertPackToolsCoverCatalog(names)` | Test: packs ⊇ catalog |

---

## 7. Permissions & app roles

- **Org roles** (`owner`, `admin`, `guest`, …) stay global via Better Auth.
- **App roles** (`finance.treasurer`, …) are additive grants in `APP_ROLE_PERMISSIONS`.
- `resolveEffectivePermissions({ orgRole, appRoles })` → `allowed` / `denied` over all domain permissions.
- Discovery already returns `appRoles: []` so clients can adopt invite-time app roles later without a new API shape.

Treasurer-only fund tools = `fund.*` on `finance.treasurer` (+ owner/admin as you choose) + pack tool gates with `permission: "fund.update"`. Musicians never see those tools as `allowed`.

---

## 8. Logos ↔ MCP alignment

| Logos | MCP / Auth |
| ----- | ---------- |
| `ResourceDefinition.kind` | Proposal JSON / catalog kind (`song`) |
| `ResourceDefinition.domainId` | Pack id / `DomainId` (`music.song`) |
| `getResourceByDomainId("music.song")` | Resolve Logos resource from pack id |
| `registerResource(def)` | Add kinds without forking Auth/Studio providers |

Proposal convention: tools return a `proposal` object; Logos `extractProposal` pulls it into the tray. Keep that contract when adding kinds.

---

## 9. What not to do

- Do **not** add finance/fund logic inside Auth or Studio Logos providers — use catalog + resource registry.
- Do **not** duplicate permission allowlists inside `hosanna_permissions`; use packs + `permissionsReportForUser`.
- Do **not** register Studio-only tools on the external MCP server.
- Do **not** skip `toolCatalog.ts` when adding tools — contract tests depend on it.
- Do **not** invent a parallel permission string format; keep `resource.action`.

---

## 10. Pilot reminder (Finance)

A full Finance **fund** domain is the intended first end-to-end pilot (auth domain + pack + Logos resource + thin Finance host). It was deferred until the pack/permission/discovery spine above existed. When you ship it, follow §5 with `finance.fund` — Auth/Studio mounts should need little or no change beyond optional catalog handlers.

---

## Related

- MCP resource/skill docs: [`apps/api/docs/mcp/README.md`](../../apps/api/docs/mcp/README.md)
- Future product direction: [`../FUTURE_DIRECTION.md`](../FUTURE_DIRECTION.md)
- Auth / billing: [`./auth-and-billing.md`](./auth-and-billing.md)
- Clients (Studio, MCP): [`./clients.md`](./clients.md)
