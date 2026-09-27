# Zyra Design System

Implemented as Tailwind v4 `@theme` CSS variables in `zyra-landing/app/globals.css`. One system, used by marketing pages, the dashboard, and auth — replacing the three incompatible systems documented in `FRONTEND_REDESIGN_PLAN.md`.

## Color

**Surfaces** (warm near-white, not black):
| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FAF9F6` | page background |
| `--color-bg-elevated` | `#FFFFFF` | cards, panels, popovers |
| `--color-bg-subtle` | `#F2F0EC` | hover states, secondary surfaces, table stripes |
| `--color-bg-inverse` | `#16161A` | rare — code blocks, inverse chips |

**Borders**:
| Token | Value |
|---|---|
| `--color-border` | `rgba(20,20,18,0.08)` |
| `--color-border-strong` | `rgba(20,20,18,0.14)` |

**Text** (deep near-black, not pure `#000`):
| Token | Value | Use |
|---|---|---|
| `--color-text` | `#16161A` | headings, primary content |
| `--color-text-secondary` | `#63636A` | body copy, secondary labels |
| `--color-text-tertiary` | `#9A9AA1` | metadata, placeholders, disabled |
| `--color-text-on-accent` | `#FFFFFF` | text on the accent color |

**Accent** — restrained indigo/blue, used for the single primary action per screen, links, and active nav state. Never decorative.
| Token | Value |
|---|---|
| `--color-accent` | `#4453E8` |
| `--color-accent-hover` | `#333FD1` |
| `--color-accent-subtle` | `rgba(68,83,232,0.08)` |

**Semantic** (meaning-bound, never decorative):
| Token | Value | Meaning |
|---|---|---|
| `--color-success` | `#1F9254` | healthy, allowed, low risk |
| `--color-success-subtle` | `rgba(31,146,84,0.09)` | |
| `--color-danger` | `#D6392E` | blocked, high/critical risk |
| `--color-danger-subtle` | `rgba(214,57,46,0.08)` | |
| `--color-warning` | `#AD6B08` | medium risk, warnings |
| `--color-warning-subtle` | `rgba(173,107,8,0.1)` | |
| `--color-neutral` | `#63636A` | secondary/inactive state |

No orange anywhere in the token set. No pure-black background token.

## Typography

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif;
--font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
```

System font first — resolves to San Francisco on Apple devices automatically; Inter is the cross-platform fallback (loaded, not the primary declared face). Monospace is used sparingly, only for genuinely tabular/technical data (costs, token counts, request IDs, code) — not for every UI label the way the old dashboard used it.

| Token | Size | Line-height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `display` | `clamp(2.5rem, 5vw, 4rem)` | `1.05` | `-0.02em` | 700 | landing hero |
| `h1` | `clamp(1.75rem, 3vw, 2.25rem)` | `1.15` | `-0.015em` | 700 | page titles |
| `h2` | `1.375rem` | `1.25` | `-0.01em` | 600 | section headings |
| `h3` | `1.0625rem` | `1.3` | `-0.005em` | 600 | card/subsection titles |
| `body` | `0.9375rem` | `1.6` | `0` | 400 | paragraphs |
| `body-sm` | `0.8125rem` | `1.55` | `0` | 400 | secondary copy |
| `meta` | `0.75rem` | `1.4` | `+0.01em` | 500 | labels, timestamps, table headers |

Rule (per the apple-design skill): tracking is size-specific — tighten large text, leave body near zero, nudge small text slightly positive. Never one `letter-spacing` value for every size (the old dashboard's blanket `letter-spacing: 0.2em` uppercase-everything is gone).

## Spacing & Radii

Standard Tailwind rem spacing scale (`space-1`…`space-24`). Page gutters: `clamp(1.25rem, 4vw, 3rem)`.

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `8px` | inputs, small buttons, badges |
| `--radius-md` | `12px` | cards, panels |
| `--radius-lg` | `20px` | large surfaces, modals |
| `--radius-full` | `999px` | pills, avatars |

## Elevation

Shadows are subtle and rare — hierarchy comes from surface color, borders, and spacing first.

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(20,20,18,0.05)` | resting cards (optional — most cards use a border instead) |
| `--shadow-md` | `0 8px 24px rgba(20,20,18,0.08)` | popovers, dropdowns |
| `--shadow-lg` | `0 20px 48px rgba(20,20,18,0.12)` | modals, sheets |

## Motion

Springs, not fixed-duration `@keyframes`, for anything a user directly triggers. Values follow the apple-design skill's damping/response model, mapped to Motion/Framer Motion's `bounce`/`duration` API.

| Token | Framer Motion | Use |
|---|---|---|
| `spring.default` | `{ type: 'spring', bounce: 0, duration: 0.35 }` | panel open/close, tab switch, nav active-indicator, popover |
| `spring.snappy` | `{ type: 'spring', bounce: 0, duration: 0.22 }` | button press feedback, toggle |
| `fade.standard` | CSS `transition: opacity 150ms cubic-bezier(0.4,0,0.2,1)` | simple show/hide with no spatial motion (tooltips, skeleton→content) |

Rules applied throughout:
- Feedback starts on press (`:active` scale `0.98`), not on release.
- Popovers/menus/the notification panel set `transform-origin` to their trigger and scale+fade in, never a generic center fade.
- No overshoot/bounce on any of the above — this app has no drag/flick surfaces, so every spring is critically damped (`bounce: 0`).
- `@media (prefers-reduced-motion: reduce)` replaces all of the above with a plain opacity cross-fade.
- `@media (prefers-reduced-transparency: reduce)` raises translucent-surface opacity to solid and drops blur.
- `@media (prefers-contrast: more)` swaps soft shadows for a solid `--color-border-strong` border.

## Translucent material — used in exactly two places

1. Dashboard top bar: `background: rgba(250,249,246,0.72); backdrop-filter: blur(20px) saturate(180%);` with content scrolling underneath.
2. Notification popover: same treatment, anchored to its trigger.

Nowhere else. No stacking a translucent surface on another translucent surface.

## Component Inventory (`zyra-landing/components/ui/`)

Replaces the single `components/dashboard/kit.tsx` file with one primitive per concept:

`button` · `icon-button` · `input` · `textarea` · `select` · `badge` · `status-badge` · `severity-badge` · `provider-badge` · `card` · `metric` · `table` · `empty-state` · `skeleton` · `tooltip` · `tabs` · `popover` · `page-header` · `nav-item` · `risk-bar` (weighted risk-component visualization).

Each is a real component taking props — not a per-page inline `style={}` block.
