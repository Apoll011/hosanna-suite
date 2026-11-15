# Hosanna Suite — agent handbook

Local-only guidance for **any** coding agent working in this monorepo (`AGENTS.md` is gitignored). Prefer this file + `docs/` over inventing product or architecture context.

**Owner:** Apoll0_11 (software engineer). Prefer asking questions over guessing. Tone: clear and direct, with enough explanation that the system change is understandable — not a dump of every file touched.

---

## 1. What this file is (and alternatives)

| File | Best for |
| --- | --- |
| **`AGENTS.md` (this)** | Portable, cross-tool handbook (Cursor, Claude Code, Codex, …). **Use this.** |
| `.cursor/rules/*.mdc` | Cursor-only, optional globs / `alwaysApply`, often **committed** for the whole team |
| `CLAUDE.md` | Claude Code–specific shorthand |

Do **not** duplicate this handbook into committed rules unless asked. Per-app extras can live later as `apps/<app>/AGENTS.md` (also gitignore if personal) when a surface needs deeper local rules.

---

## 2. Repo map (bare essentials)

```
apps/auth      → auth.hosanna.live (Better Auth UI, /home hub, billing, notifications APIs)
apps/studio    → studio.hosanna.live (Vite planning dashboard, local-first)
apps/api       → api.hosanna.live (replication, domain APIs, MCP)
apps/saas      → hosanna.live marketing
packages/*     → shared: auth, ui, db, i18n, chordpro, … (favicons live in each app’s public/)
docs/          → architecture + product direction (read before inventing)
```

Package manager: **pnpm** + **turbo**. Node ≥ 24.

Useful commands (from suite root):

```bash
pnpm install
pnpm --filter @hosanna/auth build
pnpm --filter @hosanna/auth-app dev      # auth ~5174
pnpm --filter @hosanna/studio dev
pnpm --filter @hosanna/api dev
pnpm typecheck
pnpm test
pnpm openapi:generate                    # rebuild OpenAPI spec and @hosanna/types
pnpm openapi:check                       # fail on stale spec/types (run in CI)
```

---

## 3. Docs — when to read / update

### Mandatory before non-trivial work (pick what matches the task)

| Task | Read first |
| --- | --- |
| Anything cross-cutting / “where does X live?” | [`docs/architecture/README.md`](docs/architecture/README.md) |
| Auth, sessions, RBAC, Stripe | [`docs/architecture/auth-and-billing.md`](docs/architecture/auth-and-billing.md) |
| Home, App Switcher, AccountMenu, personal settings / app scopes | [`docs/architecture/suite-hub-and-preferences.md`](docs/architecture/suite-hub-and-preferences.md) |
| UI / visual work | [`docs/hosanna-visual-language.md`](docs/hosanna-visual-language.md) **and** current tokens in `apps/studio/src/index.css` / `apps/auth/app/globals.css` / `packages/ui` |
| Longer product direction | [`docs/FUTURE_DIRECTION.md`](docs/FUTURE_DIRECTION.md) (vision — do not treat unfinished ideas as shipped) |

### Optional / deeper (as needed)

- [`docs/architecture/data-and-sync.md`](docs/architecture/data-and-sync.md), [`clients.md`](docs/architecture/clients.md), [`backend-internals.md`](docs/architecture/backend-internals.md)
- [`docs/architecture/notifications.md`](docs/architecture/notifications.md), [`mcp-domain-packs.md`](docs/architecture/mcp-domain-packs.md)
- App READMEs under `apps/*/README.md`
- MCP skill docs under `apps/api/docs/mcp/`

### Docs vs code

If docs and code disagree: **ask the human** before choosing. Do not silently “fix” docs to match a guess.

### Updating docs

On **biggish** behavior or architecture changes, update the relevant `docs/` (and visual-language when UI patterns move) **without waiting to be asked**. Skip doc churn for tiny local fixes.

---

## 4. How to work with the human

1. **Ask questions** when requirements, tradeoffs, or docs/code conflicts are unclear. Prefer questions over inventing product decisions.
2. **Creative control** only when explicitly given — otherwise propose options / ask.
3. Use **plan mode** for multi-file or architecture-shaped work.
4. End of a meaningful change: explain **the system that was built or changed** (how it fits together), not only a file list.
5. Skills: use project/global agent skills when relevant (see §12). Hosanna docs and this handbook beat generic skill advice when they conflict.

---

## 5. Git and branches

- Default branch for work: **`develop`**. Do not create feature branches unless explicitly told.
- **Commit as you go** in small patches (conventional commits). One coherent patch → one commit → next patch → next commit.
- Conventional commit style (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Focus the subject on **why**.
- **Never co-author / co-sign commits** (no `Co-authored-by`, no amending authorship onto the human’s commits, no agent trailer that attributes the commit to the model).
- Do not force-push, skip hooks, or rewrite shared history unless explicitly requested.
- Do not push unless asked.
- **Human commits during work:** If while working you notice the git tree is clean, files were committed, or new commits appeared, it was the human — adapt, verify context, and continue.

---

## 6. Comments (hard rule)

Comments are rare. Default is **no comment**. If the type, name, or call site already says it — **do not comment it**. Explaining a change, a race you fixed, or how two apps sync belongs in the **commit message / chat**, never above the code.

### Forbidden (delete these; never add them)

- Inline narration of what the next lines do:  
  `// From Music / other products, stamp returnUrl so Home can send the user back.`
- Prop / field JSDoc that only restates the type or the obvious UI:  
  `/** Absolute logo URL, or null when the app has no mark yet. */`  
  `/** When missing, shows the coming-soon clock. */`  
  `/** menu = compact code chips for AccountMenu */`
- **Design / fix essays** — “why this exists”, “used so that…”, “prevents lagging X from reverting Y”, “Auth ↔ Studio update live”, multi-sentence JSDoc on a field whose name is already clear (`revisedAt`, `syncThemeFromSharedCookie`, …)
- “Why we changed it” / history / “this used to” / “never do X” / “IMPORTANT” / “NOTE:”
- Changelog-style blurbs above components whose classes already express the behavior
- JSDoc on every export “for completeness”
- CSS comments that lecture about past bugs (`/* never a universal * transition */`) unless the trap is truly non-obvious **and** still active

**Litmus test:** if deleting the comment does not make a careful reader misunderstand an active, non-obvious invariant, delete it. Prefer renaming the symbol over documenting a vague one.

### Allowed (rare)

- A non-obvious invariant or subtle bug trap that **code and names cannot express** (one short line, present tense, no history)
- A required external constraint (protocol, vendor quirk) with no clearer name/API
- Existing license headers already used by the repo — do not invent new banner noise

When editing a file, **strip narrative comments you would not be allowed to add** in the hunk you touch (don’t drive-by-delete unrelated docs, but don’t leave your own narration behind).

---

## 7. TypeScript and code quality

- Avoid `any`. Avoid needless `| undefined` / optional soup — model domain types so absence is explicit and intentional.
- Prefer existing package APIs over copying logic across apps.
- Stay on task: no drive-by refactors unrelated to the request.
- Match local style (imports, components, naming) in the files you touch.

### Suggested package boundaries

- `@hosanna/auth` — shared auth factory helpers, suite registry, **personal-settings** store + scope registry. Apps configure a host (`configurePersonalSettings`); they do not reimplement the store.
- `@hosanna/auth/server` — server-only Better Auth factory; do not import from Vite/Studio client bundles.
- `@hosanna/ui` — shared chrome (App Switcher, AccountMenu, SuiteAppIcon, primitives). Prefer these over one-off copies.
- `@hosanna/db` / Prisma — schema and migrations; treat destructive DB ops as forbidden (see §10).
- App-scoped prefs → `registerAppSettingsScope` / `apps.<id>` (see suite-hub doc). Do not dump app-only keys onto root personal settings.
- Shared user-facing copy that crosses apps → `@hosanna/i18n`. Truly app-specific strings may live in that app’s locale files.

### API changes & OpenAPI contract (hard rule)

Any change to API routes, query params, request bodies, or responses in `apps/api` or `apps/auth` **must** update the corresponding OpenAPI generator definitions.
- Never edit `packages/types/openapi.yaml` directly by hand.
- Run `pnpm openapi:generate` to regenerate the contract and TypeScript types.
- Verify freshness with `pnpm openapi:check` before committing. CI fails on any uncommitted contract drift.

Adding a whole new suite app involves more than prefs (catalog registry, URLs, i18n keys, etc.). Follow existing architecture docs when that work comes up; **do not** paste a full “how to add an app” essay into every change.

---

## 8. Tests

- Prefer **adding tests with features** as they land (unit/integration where the package already tests).
- Goal: strong coverage over time even if the human does not enjoy writing tests personally.
- Do not invent a parallel test stack; use what the package/app already uses (`tsx --test`, app harnesses, etc.).
- Fix or extend tests when you break them.

### Playwright e2e (root `tests/`)

Root Playwright covers **saas** (marketing), **auth** (login/register/validation), and **studio** (demo + unauth redirects). Config: `playwright.config.ts` (auto-starts the three apps).

```bash
pnpm test:e2e                 # full suite
pnpm test:e2e --project=saas  # or auth / studio
pnpm test:e2e:ui              # interactive
```

**After big UI changes, run e2e before you call the work done** — do not wait to be asked. That includes layout/nav overhauls, auth/marketing page redesigns, shared `@hosanna/ui` chrome changes, demo/sidebar/toolbar flows, or anything that moves labels, routes, CTAs, or `data-tour` hooks the specs rely on.

- Update or add specs in `tests/saas/`, `tests/auth/`, `tests/studio/` when the UI contract changes (roles, labels, hrefs, `data-tour`).
- Prefer stable locators (`getByRole`, `data-tour`) over brittle CSS/class chains.
- Tiny CSS-only tweaks with no user-visible flow change: skip e2e unless something already fails.

---

## 9. UI and i18n

- Before UI work: read [`docs/hosanna-visual-language.md`](docs/hosanna-visual-language.md) **and** the live tokens/components. If the doc is behind the code, **update the doc** as part of the work.
- Per-app accent from `SUITE_APP_REGISTRY` (`applySuiteAppAccent` / CSS vars); Figtree chrome; shared `@hosanna/ui`. No second unrelated brand system.
- Suite chrome (home grid, App Switcher, AccountMenu, theme transitions) is part of the product language — keep Auth and Studio aligned.
- **i18n:** strings shared across apps → `@hosanna/i18n` (`suite.*`, etc.). Strings only used inside one app → that app’s locale files.
- **Shared components own their i18n:** any reusable UI in `packages/*` (not just AccountMenu / App Switcher) must keep default user-facing copy in `@hosanna/i18n` and resolve it inside the component (pass `language` when reactive). Hosts must **not** duplicate those strings in every app locale or pipe them through a `labels={{…}}` bag. Host `labels` / custom text only when the surface truly needs different wording (rare exception). Host-specific links/sections may still pass their own labels.
- **After a substantial UI change:** run Playwright (§8) and fix/extend specs so they match the new UI.

---

## 10. Safety (local / hosted with real data)

This environment often uses **real production-like data** on local and hosted **dev**. Demo mode is rarely the path.

- **Never** drop, wipe, truncate, or “reset” the database (or mass-delete org data) unless the human explicitly orders that exact operation.
- Do not run destructive migration resets (`migrate reset`, `db push --force-reset`, etc.) unless explicitly requested.
- Do not commit secrets. `.env` is local; examples stay in `.env.example` patterns already used by the repo.
- Be careful with billing webhooks, auth session/cookie domains, and replication checkpoints — ask if a change could strand real users or data.

---

## 11. Personal settings & suite shell (pointer only)

Canonical write-up: [`docs/architecture/suite-hub-and-preferences.md`](docs/architecture/suite-hub-and-preferences.md).

Short rules:

- Core cross-app prefs: `theme`, `language` (+ theme cookie / boot script).
- App prefs: scoped under `apps.<id>` via `defineAppSettingsScope` / `registerAppSettingsScope`.
- Preserve unknown `apps.*` on every metadata merge/write.
- Catalog: `SUITE_APP_REGISTRY` + `GET /api/suite/apps`; clients SWR-cache; home + App Switcher share it.

---

## 12. Agent skills

Discover/install via [`npx skills`](https://skills.sh/) (`npx skills find …`, `npx skills add …`). Project skills may live under `.agents/` (gitignored). Prefer skills that match this stack; **Hosanna docs win** over generic design/React advice when they conflict.

Installed in this project’s `.agents/skills/` (gitignored). Re-run `npx skills list -p` to refresh.

**Frontend / UI:** `frontend-design`, `vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`, `building-components` (from `vercel/components.build`), `vercel-react-view-transitions`, `tailwind-4-docs` — **defer to** `docs/hosanna-visual-language.md` when design skills conflict.

**Monorepo:** `turborepo`, `monorepo-management`

**Auth / backend / DB:** `better-auth-best-practices`, `better-auth-security-best-practices`, `supabase`, `supabase-postgres-best-practices`, `prisma-client-api`, `prisma-cli`, `prisma-database-setup`

**AI / MCP:** `mcp-builder`

**Testing:** `webapp-testing`, `vitest`, `javascript-testing-patterns`, `playwright-best-practices`, `playwright-cli`

**TypeScript / Next / CF:** `typescript-advanced-types`, `typescript-best-practices`, `nextjs-app-router-patterns`, `nextjs-on-cloudflare`

**Other:** `vercel-flags`

Search more with `npx skills find <query>` ([skills.sh](https://skills.sh/)).

---

## 13. Definition of done (typical patch)

1. Questions resolved for unclear product/architecture choices.
2. Code matches existing patterns; comments only if strictly necessary.
3. Types clean (`any` avoided); relevant package/app typecheck.
4. Tests added/updated with the feature when there is a natural place for them.
5. **API / route / validator changes:** update the OpenAPI generator definitions, run `pnpm openapi:check` clean, and commit the updated `packages/types/openapi.yaml` and `src/schema.ts`.
6. **Big UI changes:** `pnpm test:e2e` (or the relevant `--project`) run green; Playwright specs updated if labels/routes/`data-tour` changed.
7. Docs / visual-language updated on biggish or UI-direction changes.
8. Conventional commit for the patch (no co-authors).
9. Short explanation of **what system now exists or how it changed**.
