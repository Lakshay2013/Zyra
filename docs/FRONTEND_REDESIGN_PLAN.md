# Zyra Frontend Redesign Plan

Scope: `zyra-landing/` only. No backend/API contract changes — every page keeps its existing `lib/api.ts` calls, `lib/auth.ts` session handling, and data shapes exactly as-is.

## 1. Current Frontend Architecture

- **Framework**: Next.js 16 (App Router, Turbopack, React 19.2), TypeScript, Tailwind CSS v4 (`@theme` tokens in `app/globals.css`), `framer-motion`/`motion` already installed, `lucide-react` for icons, `@radix-ui/react-slot` + `class-variance-authority` already wired into `components/ui/button.tsx`.
- **Routing**: file-based app router. Marketing pages at the root (`/`, `/platform`, `/architecture`, `/observability`, `/docs`, `/security`, `/privacy`, `/terms`, `/status`), auth pages (`/login`, `/register`), and a nested `/dashboard/*` tree with a shared `app/dashboard/layout.tsx` shell wrapping 10 pages (`page.tsx` overview, `playground`, `security`, `cost`, `logs`, `audit`, `providers`, `apikeys`, `policies` (settings), `billing`, `team`).
- **Data**: `lib/api.ts` is a thin axios wrapper (JWT bearer injection, 401→redirect). Every dashboard page fetches its own data with `useEffect`/`api.get` and holds state locally — no shared data layer, no design-system-breaking side effects to worry about when restyling.
- **Styling pattern**: business logic (state, effects, API calls) and presentation are already cleanly separated inside each page component — pages render inline `style={{...}}` objects sourced from a shared token object, not deeply nested Tailwind utility soup. This makes a visual-only rewrite tractable: hooks and handlers can be left untouched while JSX/markup is replaced.

## 2. Current Design Problems

This codebase runs **three different, mutually inconsistent design systems** at once, none matching the brief's target aesthetic:

1. **Marketing pages** (`app/page.tsx`, `/platform`, `/architecture`, `/observability`, `/docs`, `/security`, `/privacy`, `/terms`, `/status`) use `brand-*` Tailwind tokens defined in `globals.css`: black background (`#0B0B0C`), orange/salmon accent (`#FFA69E`), plus a large amount of decorative CSS — custom dual-layer cursor, animated aurora mesh, drifting blobs, canvas starfield, page-load curtain, logo glitch effect, shimmer-sweep buttons, ripple effects, letter-scramble text, gradient-animated text, spinning avatar-gradient borders, 3D tilt-card + glare, spotlight-follow-cursor cards, and a scroll progress bar. This is the "noisy glassmorphism / neon / excessive decorative UI" the brief explicitly wants removed.
2. **Dashboard pages** (`app/dashboard/**`, `components/dashboard/kit.tsx`) use a second, separate hand-rolled dark "terminal" palette (`#131314` bg, `#ffa69e` accent again, JetBrains Mono, uppercase-tracked labels everywhere, Google's Material Symbols icon font) with all styling as inline `style={}` objects reading from a `C` constants object — not Tailwind, not the same tokens as the marketing site.
3. **Login/Register pages** use a *third* scheme: Material Design 3-style class names (`bg-surface-container-low`, `text-on-surface`, `bg-primary-container`, `text-outline-variant`, `font-headline`, `font-body`) that **are not defined anywhere in `globals.css`'s `@theme` block** — these Tailwind classes silently resolve to nothing, so the login/register screens are one broken-token accident away from looking wrong, and already don't match either of the other two systems.

Additional problems: no reusable primitive library (each page hand-rolls its own card/badge/table markup with inline styles — `components/dashboard/kit.tsx` has some shared pieces but is a single 122-line file, not a real primitive set); orange is the dominant color everywhere; black is the dominant background everywhere; heavy use of glow/shadow/gradient decoration; no motion discipline (mix of CSS `@keyframes`, ad-hoc `transition`, and framer-motion, none following spring/interruptibility principles); accessibility gaps (color-only security-state signaling in places, decorative cursor breaks default focus/pointer affordances, no visible reduced-motion/transparency/contrast handling beyond one global `prefers-reduced-motion` blanket rule).

## 3. New Visual Direction

Calm, minimal, precise, spatial, technical, confident — per Apple's *Designing Fluid Interfaces* / *Principles of Great Design* guidance (full reference read and applied: response-on-press, critically-damped springs as the default, spatial consistency, translucent material used sparingly and only where it aids hierarchy, system-font-first typography with size-specific tracking/leading). Concretely:

- **One design system, three surfaces** (marketing, dashboard, auth) instead of three incompatible ones.
- **Light-first**: warm near-white background, soft neutral surfaces, deep near-black text — not black-first.
- **Restrained indigo/blue accent**, used for the single primary action per screen, not painted across every card border and icon.
- **Semantic color only where it's semantic**: green = healthy/success, red = blocked/high-risk, amber = warning, gray = neutral/secondary. Never decorative.
- **No orange as brand color**, no aurora/blob/cursor/glitch/shimmer/ripple/curtain decoration, no gradient text, no 3D tilt cards, no spotlight-follow-cursor glow.

## 4. New Design System

See `docs/FRONTEND_DESIGN_SYSTEM.md` for the full token reference (colors, type scale, spacing, radii, shadows, motion). Implemented as Tailwind v4 `@theme` tokens in `app/globals.css` so every page (marketing, dashboard, auth) draws from the same source — closing gap #2/#3 above.

## 5. Page-by-Page Redesign Plan

| Page | Plan |
|---|---|
| `app/layout.tsx` | System-font stack, drop Material Symbols font import (replace with `lucide-react`, already installed), retoken `Toaster` |
| `app/globals.css` | Full rewrite: new tokens, Apple-motion utility classes, reduced-motion/transparency/contrast media queries; delete all decorative CSS |
| `app/dashboard/layout.tsx` | New translucent app shell: light sidebar + top bar, spring-based active-item indicator, real notification/settings/avatar affordances kept, mobile drawer kept |
| `app/page.tsx` (landing) | Full rewrite: new hero, product visualization, security/cost/observability sections, architecture, final CTA — copy trimmed, illustrative product panel kept honest about being illustrative |
| `app/login/page.tsx`, `app/register/page.tsx` | Rebuilt on the real token system (fixes the currently-undefined-class bug), same auth logic |
| `app/dashboard/page.tsx` (Overview) | KPI-led hierarchy: greeting → primary spend number → trend → requests/risk/cost-by-model/recent activity, real data unchanged |
| `app/dashboard/playground/page.tsx` | Two-panel workspace per the brief; same request logic, restyled response/security/routing/cost panels |
| `app/dashboard/security/page.tsx` | Overview stats, risk distribution, risk reports list + detail drawer with the formula spelled out |
| `app/dashboard/cost/page.tsx` | One strong without/with-Zyra story, cost by model/provider, real optimization data (no fabricated numbers) |
| `app/dashboard/logs/page.tsx` (Requests) | Clean table (time/model/provider/tokens/cost/risk/status) + row detail |
| `app/dashboard/audit/page.tsx` | Scannable list (timestamp/actor/action/resource/status), expandable technical detail |
| `apikeys`, `providers`, `policies`, `team`, `billing` | Restyled onto the same primitives/tokens as the pages above; functionality untouched — lower design-effort pass since these are secondary/settings-class screens, not the flagship experience |
| Marketing sub-pages (`architecture`, `docs`, `observability`, `platform`, `privacy`, `security`, `status`, `terms`) | Retokened onto the new design system (colors/type/spacing/motion) so nothing looks like the old product; not a full narrative rewrite of each page's copy |

## 6. Component Strategy

Replace `components/dashboard/kit.tsx` (a single ad-hoc file) with a proper primitive set in `components/ui/`, each a real reusable component (not inline-style-per-page):

`button` (existing, retokened) · `icon-button` · `input` · `textarea` · `select` · `badge` (generic) · `status-badge` (SAFE/BLOCKED/WARN) · `severity-badge` (low/med/high/critical) · `provider-badge` · `model-badge` · `card` · `metric` (KPI tile) · `table` · `empty-state` · `skeleton` · `tooltip` · `tabs` · `modal`/`sheet` · `popover` · `risk-indicator` (weighted-bar breakdown) · `cost-indicator` · `activity-item` · `page-header` · `nav-item`.

One implementation per concept — no per-page reinvention.

## 7. Motion Strategy

Per the apple-design skill (`emilkowalski/skills`, read in full before any implementation):

- Default to critically-damped springs (`damping 1.0`, `response 0.3–0.4`) for all UI transitions — panel opens, tab switches, menu/popover appearance, page-header state changes.
- Reserve slight bounce (`damping ~0.8`) only for momentum-driven interactions (none currently planned — no drag/swipe surfaces in this app; noted for future).
- Respond on press, not release: buttons get an instant `:active` scale, not a delayed transition.
- Anchor popovers/menus/notification-panel to their trigger (`transform-origin`), not a generic fade.
- Sidebar active-indicator and tab underlines slide/morph between positions rather than cross-fading.
- Translucent surfaces (top bar, notification panel) use `backdrop-filter`, content scrolls underneath — never stacked translucent-on-translucent.
- Respect `prefers-reduced-motion` (cross-fade instead of slide/spring), `prefers-reduced-transparency` (solid instead of blurred), `prefers-contrast` (solid border instead of soft shadow).
- Delete every decorative animation with no functional purpose (cursor, aurora, blob, glitch, ripple, curtain, letter-scramble, spinning avatar border).

## 8. Accessibility Strategy

- Real semantic HTML (`button`, `nav`, `table`, `label`+`input` pairing) instead of `div`-soup with `onClick`.
- Visible focus rings using the new `--color-ring` token on every interactive element (buttons, inputs, nav items, table rows that act as links).
- Security/risk state never conveyed by color alone — pair color with a label/icon (already partially true; will be enforced consistently in the new `status-badge`/`severity-badge` primitives).
- `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` all handled in `globals.css`, not just a blanket "kill all animation durations" rule.
- Sufficient contrast for body text and metadata on the new light surfaces (verified against WCAG AA during implementation, not just assumed from the palette).

## 9. Responsive Strategy

Desktop-first (this is a data-dense operator tool), but every page must be genuinely usable on mobile, not just shrunk:

- Dashboard sidebar collapses to the existing mobile drawer pattern (kept), top bar stays translucent and fixed.
- Tables (Requests, Audit, Cost-by-model) switch to a stacked card layout below the `md` breakpoint instead of horizontal-scrolling a dense table.
- Playground's two-panel layout stacks vertically on mobile (prompt on top, response below), preserving the same information, not hiding any of it.
- Landing page sections that are two-column on desktop (problem/solution, pipeline diagram, cost comparison) stack single-column on mobile with the same content and order.
- Typography scales via `clamp()` for display sizes so large headings don't overflow small viewports.

## Execution Order

1. Design tokens + primitives (`globals.css`, `components/ui/*`) — everything else depends on this.
2. App shell (`app/dashboard/layout.tsx`), `app/layout.tsx`.
3. Landing page, login, register.
4. Dashboard: Overview, Playground, Security, Cost (the four "flagship" screens named explicitly in the brief).
5. Dashboard: Requests (logs), Audit.
6. Dashboard: remaining settings-class pages (API keys, Providers, Policies, Team, Billing) on the new primitives.
7. Marketing sub-pages retokened.
8. Build, fix errors, manual page-by-page check.
9. Quality pass against the brief's Phase 21 checklist.
10. `docs/FRONTEND_DESIGN_SYSTEM.md` and `docs/FRONTEND_REDESIGN_REPORT.md`.
