# Hosanna visual language

Canonical look-and-feel for Hosanna product surfaces: **Studio**, **Auth** (login, account center, **suite home**), and anything that shares `@hosanna/ui`.

This is not a new brand brief. It records what already ships. Prefer tokens and shared components over one-off styling. When UI direction moves in code, **update this file** in the same change.

**Source of truth**

| Layer             | Where                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| CSS tokens        | `apps/studio/src/index.css`, mirrored in `apps/auth/app/globals.css`                                  |
| Shared primitives | `packages/ui` (`Button`, `Input`, `Badge`, `Tabs`, `Modal`, `EmptyState`, `PageHeader`, `Surface`, `AppSwitcher`, `AccountMenu`, `SuiteAppIcon`, …) |
| Workspace chrome  | Studio `AppSidebar`, explorer menus/toolbars, service Plan/Read, address-bar suite controls           |
| Account / hub     | Auth home (`/home`), `AccountNav` / account layouts, header: Logos → App Switcher → AccountMenu     |

When Studio and Auth disagree, **Studio tokens win** and Auth should catch up — except Auth has no lyric/score surface, so it may omit `--font-lyric`.

Cross-app prefs and suite catalog behavior: [`architecture/suite-hub-and-preferences.md`](./architecture/suite-hub-and-preferences.md).

---

## Brand stance

Hosanna is a calm workspace for planning worship: songs, collections, services, agenda. It should feel like a well-set desk — not a marketing site, not a second product, not a dashboard of colored cards.

One accent (sky). Quiet chrome. Figtree everywhere in the UI. Serif only for words people sing or speak.

Do not invent a second palette, display face, gradient system, or motion style.

---

## Color

Semantic tokens (`--m3-*`). One accent; status colors only for status.

### Light

| Role                        | Token                           | Value     |
| --------------------------- | ------------------------------- | --------- |
| Accent                      | `--m3-primary`                  | `#0284c7` |
| Accent pressed              | `--m3-primary-dark`             | `#0369a1` |
| Accent tint                 | `--m3-primary-light`            | `#e0f2fe` |
| Text                        | `--m3-text`                     | `#1a1d24` |
| Secondary text              | `--m3-secondary`                | `#5c6570` |
| Page                        | `--m3-bg`                       | `#f4f6f8` |
| Sidebar / toolbar           | `--m3-sidebar` / `--m3-toolbar` | `#eef1f4` |
| Card                        | `--m3-card`                     | `#ffffff` |
| Border                      | `--m3-border`                   | `#d0d7e0` |
| Hover                       | `--m3-hover`                    | `#e8ecf0` |
| Placeholder / muted control | `--m3-input`                    | `#6b7280` |
| Success                     | `--m3-success`                  | `#059669` |
| Warning                     | `--m3-warning`                  | `#d97706` |
| Danger                      | `--m3-danger`                   | `#e11d48` |

### Dark

| Role                       | Value                                         |
| -------------------------- | --------------------------------------------- |
| Accent                     | `#5babdb` (pressed `#3d8ab8`, tint `#0f2d40`) |
| Surfaces                   | `#0b0d12` / `#12151c` / `#181b23`             |
| Text / secondary           | `#eceef2` / `#9aa0b0`                         |
| Border / hover             | `#2d3244` / `#1f2330`                         |
| Success / warning / danger | `#34d399` / `#fbbf24` / `#fb7185`             |

**Use accent for:** current selection, active nav, links, focus rings, primary commits.

**Do not** paint menu icons emerald/amber/sky for decoration. Status color belongs on status: score, sync, destructive action, toast.

---

## Type

| Face           | Token                            | Use                               |
| -------------- | -------------------------------- | --------------------------------- |
| Figtree        | `--font-sans` / `--font-display` | All chrome, titles, nav, forms    |
| Source Serif 4 | `--font-lyric`                   | Lyrics and readings only (Studio) |
| JetBrains Mono | `--font-mono`                    | Chord symbols                     |

Never add a second display face (no Outfit, Inter-as-brand, poster type).

### Scale (do not go larger)

| Role          | Class / token                      | Size                              | Weight | Tracking           |
| ------------- | ---------------------------------- | --------------------------------- | ------ | ------------------ |
| Page title    | `.text-display` / `--text-display` | 24px (clamped on small viewports) | 600    | -0.02em            |
| Section title | `.text-title` / `--text-title`     | 17px                              | 600    | -0.015em           |
| Body          | `.text-body` / `--text-body`       | 14px                              | 400    | —                  |
| Secondary     | `.text-muted` / `--text-secondary` | 13px                              | 500    | secondary color    |
| Label         | `.text-label` / `--text-label`     | 12px                              | 600    | +0.01em, secondary |
| Caption       | `.text-caption` / `--text-caption` | 11px                              | 500    | secondary          |

Numbers that are compared (durations, counts, hymn numbers) use tabular figures (`.tabular-nums`). Song and folder titles are medium, not bold.

---

## Shape, elevation, density

### Radius

| Token           | Size | Use                                           |
| --------------- | ---- | --------------------------------------------- |
| `--radius-sm`   | 6px  | Chips, dense controls, pill-tab selected chip |
| `--radius-md`   | 10px | Buttons, inputs, inset surfaces               |
| `--radius-lg`   | 14px | Cards, panels, empty states                   |
| `--radius-xl`   | 20px | Menus, dialogs, toasts                        |
| `--radius-pill` | full | Counts, scrollbar thumbs                      |

### Shadows (quiet)

| Token           | Use                                 |
| --------------- | ----------------------------------- |
| Hairline border | Resting structure                   |
| `--shadow-sm`   | Resting cards / primary button lift |
| `--shadow-md`   | Popovers, float surfaces            |
| `--shadow-lg`   | Dialogs                             |

No glow, no colored shadow.

### Surfaces (`Surface` / CSS)

- **default** (`.surface`) — card + border + `--radius-lg`
- **quiet** (`.surface-quiet`) — card, no border
- **inset** (`.surface-inset`) — recessed sidebar tone + soft border

### Density

Two real densities (Studio explorers):

|                   | Comfortable (default) | Compact                  |
| ----------------- | --------------------- | ------------------------ |
| Card padding      | ~16px                 | tighter                  |
| Icon targets      | 40–44px               | smaller but still usable |
| List rows         | ~56px                 | shorter                  |
| Collection covers | ~144px tall           | reduced                  |

Compact tightens padding, type, icons, and cover height. It does not remove actions or metadata. Hit targets stay ≥40px; primary commit / sole icon actions ≥44px. On phone, respect safe areas; comfortable is the default density.

---

## Components (`@hosanna/ui`)

Reuse these instead of restyling from scratch.

### Buttons

Variants: `primary` | `secondary` | `danger` | `ghost` | `outline` | `link`.

Sizes: `sm` (min 32px) | `md` (min 40px) | `lg` (min 56px) | `icon` (40×40).

Primary = filled accent + white text. Secondary = sidebar fill + border. Ghost = quiet hover. Link = accent text only. Color transitions ~150ms; focus-visible = 2px accent outline, offset 2.

### Inputs

Label uses `.text-label`. Field: `--radius-md`, card fill, body text, min height 40px. Focus: accent border + soft accent ring (`ring-m3-primary/25`). Error: danger border/ring + danger helper. Leading icons mute → accent on focus-within.

### Badges

Variants: `accent` | `success` | `warning` | `danger` | `neutral` (legacy sky/emerald/amber/rose/slate map to these). Small radius (`--radius-sm`), tinted fill + matching border. Not for menu decoration.

### Tabs

- **underline** (default): 40px tall, bottom border; selected = accent text + 2px accent underline.
- **pill**: recessed track (`bg-m3-sidebar`), selected chip on card with `--shadow-sm`.

Tablists hide vertical scrollbars; keep height fixed so a 1px underline overlap does not spawn a tiny scrollbar.

### Empty state

Dashed border, sidebar-tint fill, centered. Optional muted icon chip, `.text-title`, short `.text-muted` description, **one** primary button when the user can act. No illustration heroes.

### Page header

`.text-display` title, optional muted description, actions aligned end on wide viewports. One title per screen — then the toolbar, then the work.

### Modal / confirm

Scrim: `bg-m3-bg/75` + light blur. Panel: card, border, `--radius-xl`, `--shadow-lg`. Open/close **200ms** ease-in-out; panel scales from `0.98` → `1`. Escape closes; focus moves into the panel on open.

### Context menus (Studio explorer pattern)

Same object everywhere:

- Fixed to pointer/button, **224px** (`w-56`), `--radius-xl`, `p-1.5`, card + border + `--shadow-lg`
- Enter: `.hosanna-enter` (fade + scale 0.98→1, **180ms** ease-in-out)
- Optional one-line label header, then hairline
- Rows ≥40px, 14px icons in secondary color, medium label
- Destructive once: danger text/icon, danger tint on hover, separated by hairline

Do not color “edit” sky and “move” green. Monochrome, then one danger row.

---

## Navigation and hierarchy

### Active nav

Tint + accent text — not a filled pill and **not** a leading accent bar:

`bg-m3-primary/10 text-m3-primary`

Inactive: secondary text, hover → `--m3-hover` + primary text.

Studio sidebar rows: `rounded-md`, min height 40px, ~13px medium. Auth account nav: same tint recipe, `rounded-lg`, fixed on desktop while content scrolls (spacer column keeps layout).

### Screen structure

One title, one toolbar, then the work. No hero banners, gradient headers, or a card around every row. Orders, folder tables, and song lists are **divided lists**: hairline separators, title first, metadata on a second line when narrow.

### Auth vs Studio

|        | Studio                   | Auth                                                              |
| ------ | ------------------------ | ----------------------------------------------------------------- |
| Tokens | Full set + lyric font    | Same m3 tokens; no lyric surface                                  |
| Shell  | App sidebar + main stage | Home hub, account nav + scrolling content                         |
| Header | Address bar: AI → grid   | Same order: Logos AI → App Switcher → AccountMenu                 |
| Toasts | Product toasts           | Banner under header, **offset past the fixed sidebar** on desktop |
| Login  | —                        | Quiet form chrome; brand present but not a marketing hero         |

Account settings pages should feel like Studio settings: `PageHeader`, `Surface` / bordered cards, `Tabs`, shared buttons — not a separate “admin theme.”

### Suite shell (home, switcher, account menu)

Shared across Auth and Studio via `@hosanna/ui` — one composition language, not a second product skin.

**Home (`auth …/home`)**

- Quiet page: brand-present header, then one app grid (live + coming soon). No marketing hero, no stat strips.
- Tiles use `SuiteAppIcon`: rounded well, logo **scaled to cover** (crop opaque padding; no letterboxed marks).
- Coming-soon apps stay visible but muted / non-primary.

**App Switcher**

- Waffle opens a popover: short greeting, same catalog as home, link back to auth home.
- Popover follows menu elevation (`--radius-xl`, card, border, `--shadow-lg`); enter motion aligned with `.hosanna-enter`.
- Current app can be highlighted as “here” (muted, not a second accent system).

**AccountMenu**

- Google-style account popover: identity, org switcher (when multi-org), theme + language controls, account links.
- Theme control is compact (segmented / iOS-style toggle is fine); still uses m3 tokens — no purple/glow kit.
- Org rows use the same quiet avatar + label pattern as elsewhere; destructive actions stay monochrome-until-danger.

Theme and language persist through `@hosanna/auth` personal settings (cookie + metadata). Do not invent parallel `localStorage` theme keys on new surfaces.

---

## Motion

Motion explains size or presence. No bounce, flash, or blocking the next click.

| Pattern                                                         | Duration              | Notes                                                                                                                                      |
| --------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Panel open/close (editor panes, library beside order, sidebars) | **300ms** ease-in-out | Keep mounted; animate width/flex + opacity. Closed = width 0, opacity 0, no pointer events. Avoid `display: none` / `hidden` mid-animation |
| Mode crossfade (Plan ↔ Read)                                    | ~300ms                | Both views mounted; ~4px travel                                                                                                            |
| Expanding row body/notes                                        | ~300ms                | Animate height; keep content mounted                                                                                                       |
| Menu enter                                                      | **180ms**             | `.hosanna-enter`                                                                                                                           |
| Dialog / toast                                                  | **200ms**             | Scrim fade + panel scale 0.98                                                                                                              |
| Button / color hover                                            | ~150ms                | Color only                                                                                                                                 |
| Theme flip (menu toggle or cross-app hydrate)                   | ~350ms / View Transition when available | `runThemeTransition` + `html.theme-transition` on color/fill/stroke/border; no full-page flash |

On phone, a covering panel may **translate** instead of changing width — same duration and easing, still mounted through close.

`prefers-reduced-motion: reduce` collapses durations to near zero. Do not substitute a flashier animation.

---

## Studio product patterns

### Explorer

Collections, folders, and songs share one gesture set:

- Click selects; Shift extends; ⌘/Ctrl toggles
- Double-click or Enter opens
- Escape clears selection and closes menus
- ⌘/Ctrl+A selects everything in view
- Delete confirms before remove
- Drag on empty space → selection rectangle
- Multi-select → quiet bar: count, print, delete, cancel
- Right-click and “…” → shared menu
- Sort follows the chosen label **and** direction
- Grid, list, comfortable, compact all work; list is rows, not a shrunken grid

### Song score

Inside the card, top-left, clear of the “…” control (top-right). Never on the card border. In tables, every row gets a score cell when scores are on; a folder cell is the average of songs directly inside it (rounded). No scored songs → em dash, not a blank.

### Service

Two modes, same service:

- **Plan** — library, order, preview. Library and preview open/close with panel motion; order stays readable.
- **Read** — short order + current item large enough to speak from. Arrow keys move the current item.

Phone Plan: Order + Library tabs; preview is a sheet over the order. Never let the library take the whole screen with no way back to the order.

---

## Focus, scroll, print

- Focus-visible: 2px solid `--m3-primary`, offset 2px (also `.focus-ring`)
- Scrollbars: 6px, transparent track, border thumb, accent on hover (`.custom-scrollbar` where named)
- Print (Studio): hide chrome; lyrics black; chord labels accent (`#0369a1`), bold

---

## What not to do

- Extra gradients, glass stacks, or pastel card piles
- Second display typeface
- Colored menu icons
- Whole-page scale animations, looping opacity flashes, or unmounting a pane before it finishes closing
- Score drawn outside the card
- Thin collection cover strips with the icon fighting the image — covers are real `object-cover` images, title underneath
- Changing permissions, saving, or service order just to restyle
- Inventing a separate Auth / mobile brand

---

## Mobile and other clients

Same tokens, type roles, and motion. Sheets and drawers are the panels. Menus stay monochrome. Comfortable density by default. Lyrics stay serif; chrome stays Figtree. Targets ≥44pt; content clears safe areas.

A person who used Studio and then opens Auth or a native client should recognize the accent, type, menu, and how a panel arrives.

---

## Agent brief (copy when implementing a screen)

You are building a Hosanna screen. Match Studio / Auth / `@hosanna/ui`. One sky accent (`#0284c7` light / `#5babdb` dark); quiet neutrals; Figtree for chrome; Source Serif 4 only for lyrics/readings; JetBrains Mono for chords. Page title ceiling 24px/600. Radius 6 / 10 / 14 / 20. Quiet shadows. Active nav = `bg-m3-primary/10 text-m3-primary`. Menus monochrome with one danger row; enter 180ms. Panels 300ms ease-in-out while mounted. Dialogs 200ms from scale 0.98. Suite chrome (home grid, App Switcher, AccountMenu, `SuiteAppIcon` cover-crop) stays shared. Theme changes use the personal-settings transition path. Prefer shared components. No new palette, display face, gradient system, or bounce motion. If this doc drifts from code, update the doc.
