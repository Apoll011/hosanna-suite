# Hosanna visual language

Paste the prompt below into any Hosanna client — web, iOS, or Android — when you want that surface to feel like Hosanna Studio. It was distilled from the Studio redesign: the design-system pass (`611d4f5`), the hierarchy and reading-view pass (`f25b220`), and the density follow-up (`7eac12c`), plus the motion and explorer behavior that sit on top of them.

Do not treat this as a new brand. It records the one that already exists.

---

## Prompt

You are designing and building a Hosanna screen. Hosanna is a calm workspace for planning worship: songs, collections, services, and an agenda. It should feel like a well-set desk, not a marketing site and not a second product.

Match the existing Hosanna Studio. Do not invent a palette, a display typeface, a gradient system, or a motion style.

### Color

One accent, sky. Everything else is neutral.

Light:

- Accent `#0284c7`, pressed `#0369a1`, tint `#e0f2fe`
- Text `#1a1d24`, secondary text `#5c6570`
- Page background `#f4f6f8`, sidebar and toolbars `#eef1f4`, cards `#ffffff`
- Border `#d0d7e0`, hover `#e8ecf0`
- Success `#059669`, warning `#d97706`, danger `#e11d48`

Dark:

- Accent `#5babdb` on surfaces `#0b0d12` / `#12151c` / `#181b23`
- Text `#eceef2`, secondary `#9aa0b0`, border `#2d3244`, hover `#1f2330`
- Danger `#fb7185`

Use the accent for the current selection, the active nav mark, links, and focus. Do not paint icons in emerald, amber, or sky just to decorate a menu. Status color belongs on status: a score, a sync dot, a destructive row.

### Type

One sans for all interface text, including titles: Figtree. If Figtree cannot load, use a humanist sans with the same proportions. Never add a second display face.

Source Serif 4 is only for words people sing or read aloud: lyrics and readings. Chord symbols stay monospace (JetBrains Mono).

Scale, and do not go larger:

- Page title 24px, weight 600, tracking -0.02em. This is the ceiling.
- Section title 17px, weight 600, tracking -0.015em
- Body 14px, weight 400
- Secondary 13px, weight 500, secondary color
- Label 12px, weight 600, secondary color
- Caption 11px, weight 500, secondary color

Numbers that are compared (durations, counts, hymn numbers) use tabular figures. Song and folder titles are medium, not bold.

### Shape, elevation, density

Radius: 6px chips, 10px controls, 14px cards, 20px menus and dialogs, full pill for counts.

Shadows stay quiet: a 1px hairline plus, at most, `0 1px 2px` on resting cards, `0 4px 12px` on popovers, `0 12px 32px` on dialogs. No glow, no colored shadow.

Two densities, and both must be real:

- Comfortable is the default: card padding 16px, icons 40–44px, list rows about 56px, collection covers 144px tall.
- Compact tightens padding, type, icons, and cover height. It does not remove actions or metadata.

Hit targets are at least 40px. The primary commit action and icon buttons that are the only way to do something are at least 44px. On a phone, respect the safe areas.

### Navigation and hierarchy

The sidebar is quiet. The active item is a 2px accent bar inset on the leading edge plus a tint, not a filled pill. Inactive items are secondary text.

A screen has one title, one toolbar, then the work. Do not stack hero banners, gradient headers, or a card around every row. An order, a folder table, or a song list is a divided list: hairline separators, the title first, metadata on a second line when the row is narrow.

Empty states are a short dashed region with one sentence and, when the person can act, one button. No illustration heroes.

### Menus

Every context menu is the same object:

- Fixed to the pointer or the button, 224px wide, 20px radius, 6px padding, surface card, border, quiet shadow.
- A one-line header in the label style, then a hairline.
- Rows are at least 40px, 14px icons, secondary icon color, medium label.
- Danger is used once, on the destructive row only: danger text, danger icon, danger tint on hover, separated by a hairline.
- Opening fades and scales from 0.98 to 1 in 180ms, ease-in-out.

Do not color "edit" sky and "move" green. Monochrome, then one danger row.

### Motion

Motion explains a change of size or presence. It does not flash, bounce, or block the next click.

The reference is the song editor: both panes stay mounted. They animate width (or flex basis) and opacity together, 300ms, ease-in-out. Closed means width 0, opacity 0, no pointer events. Do not use `display: none` or `hidden` on a pane whose width should animate — that skips the motion.

Use that same 300ms ease-in-out for:

- The service library opening and closing beside the order
- The service preview opening and closing
- Switching Plan and Read (crossfade, about 4px of travel, both views mounted)
- A row's notes or body expanding (animate the height, keep the content mounted)
- Sidebars and sheets

On a phone, a panel that covers the screen may translate instead of changing width. Same duration, same easing, and it stays mounted through the close.

Dialogs fade the scrim and scale the sheet from 0.98 over 200ms, in both directions.

If the person prefers reduced motion, durations collapse to nearly nothing. Do not add a second, flashier animation for them.

### Explorer behavior

Collections, folders, and songs share one set of gestures:

- Click selects. Shift extends the range. Command or Ctrl toggles.
- Double-click or Enter opens.
- Escape clears the selection and closes a menu.
- Command or Ctrl+A selects everything in the view.
- Delete asks before it removes.
- Dragging on empty space draws a selection rectangle.
- More than one selection shows a quiet bar: count, print, delete, cancel.
- Right-click and the "…" button open the shared menu.
- Sort follows the label the person picked, including direction. "Most songs" and "fewest songs" must not do the same thing.
- Grid, list, comfortable, and compact all work. List is rows, not a shrunken grid.

### Song score

The score sits inside the card, in the top-left, clear of the "…" button in the top-right. It never hangs on the card border and never shares a corner with the menu. In a table, every row has a score cell when scores are on. A folder's cell is the average of the songs directly inside it, rounded. No scored songs means an em dash, not a blank column.

### Service

Two modes, same service:

- Plan: library, order, preview. The library and the preview open and close with the panel motion above. The order stays readable.
- Read: a short order and the current item large enough to speak from. A musician starts here. Arrow keys move the current item.

On a phone, Plan is two tabs, Order and Library. The preview is a sheet over the order. Do not hide the order by letting the library take the whole screen with no way back.

### What not to do

- No extra gradients, glass, or pastel card stacks.
- No second display typeface, and no Outfit, Inter, or poster type.
- No colored menu icons.
- No animation that scales the whole page, flashes opacity on a loop, or unmounts a pane before it has finished closing.
- No score drawn outside the card.
- No collection cover that is a thin image strip with the icon fighting it. A cover is a real image, object-cover, then the title underneath.
- Do not change permissions, saving, or the order of a service in order to restyle it.

### Mobile

Use the same tokens, the same type roles, and the same 300ms ease-in-out. Sheets and drawers are the panels. Menus are the same monochrome rows. Comfortable is the default phone density; compact is a tighter list, not a different layout. Lyrics stay serif. Chrome stays Figtree. Targets stay at least 44pt, and content clears the safe areas. A person who used Studio and then opens the phone should recognize the accent, the type, the menu, and the way a panel arrives.
