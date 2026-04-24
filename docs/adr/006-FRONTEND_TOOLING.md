---
type: adr
status: accepted
date: 2026-04-23
---
# ADR-006: Frontend tooling — TypeScript + Vue + Tailwind CSS + shadcn-vue

## Status
Accepted

## Context

The prototype needs a chat UI that renders streamed AI responses, structured chart payloads, and a supplier switcher — all styled to the NexTrade brand guide captured in the artefacts. From [[../artefacts/kickoff_audio_sync]], Sarah is explicit that the result cannot look like "a generic Bootstrap template," must use the brand's Deep Teal / Lime / Inter typography, and the chat must dominate the viewport.

Nuxt is already locked in by [[001-NUXT_FULL_STACK]], which implies Vue and (by default) TypeScript. This ADR records the styling and component-library choices that sit on top.

## Decision

- **Language:** TypeScript.
- **Framework:** Vue 3 (via Nuxt).
- **Styling:** Tailwind CSS, configured with brand tokens from the NexTrade style guide (colors, typography scale, radius, shadow) declared in `tailwind.config.ts`.
- **Component library:** shadcn-vue — copy-in headless primitives built on reka-ui (the Radix Vue successor).

## Why this stack

- **Tailwind fits a strict brand guide.** The style guide is a token system; Tailwind config is a token system. Colors (`#008080`, `#39FF14`, etc.), Inter-based type scale, 4px radius, and the hairline/shadow specs translate cleanly into `theme.extend` and CSS variables.
- **shadcn-vue gives us primitives we own.** Components are generated into the repo (`components/ui/`) rather than installed from npm. That means restyling to NexTrade tokens is editing the files, not fighting a theming layer.
- **No generic look.** Sarah's constraint explicitly rules out Bootstrap-flavoured kits. Tailwind + owned components means we're not fighting a vendor's visual identity.
- **Good Nuxt integration.** First-party Nuxt modules exist for Tailwind; shadcn-vue has a Nuxt-aware CLI that scaffolds components into the right location.
- **Accessibility and behaviour inherited from reka-ui.** Dropdowns, dialogs, tooltips, focus management — solved problems we don't re-invent.

## Alternatives considered

| Option | Why not |
|--------|---------|
| **Nuxt UI** | Official, well-integrated, but prescriptive — its baked-in theme would need fighting to match the brand guide exactly. |
| **Vuetify** | Material-flavoured and opinionated about visual identity. Wrong starting point for a premium B2B brand. |
| **PrimeVue** | Comprehensive, but layers its own theming system on top; harder to pin to a strict external style guide. |
| **Naive UI** | Vue-specific and light, but has its own theming approach — still a layer to work through. |
| **Tailwind only, hand-rolled components** | Maximum flexibility, but we'd re-invent dropdowns, dialogs, and focus-management basics on a Friday deadline. |
| **reka-ui directly (no shadcn scaffold)** | Totally viable; shadcn-vue is just a CLI + style conventions on top. We're taking the conventions for speed. |

## Consequences

- **`components/ui/` is checked in and owned.** Any styling change is a direct edit of those files. No version pinning on a component library.
- **`tailwind.config.ts` is the single source of truth for brand tokens.** Any colour, spacing, or typography reference in the app resolves through it; nothing is hard-coded in components.
- **Utility-class density in templates.** Expect visually busy class strings; the tradeoff for token-enforced styling.
- **Dark mode is not in scope for MVP.** The brand guide's "Background — App: Off-White" implies a light-only palette. Add later if needed via Tailwind's built-in dark variants.
- **Chart library is a separate decision.** shadcn-vue does not ship charts. Options (Chart.js, ECharts, Recharts-equivalents for Vue) will be picked when [[../todos/completed/CHAT_UI]] kicks off.
- **reka-ui is a transitive dependency we're trusting.** It's the current evolution of Radix Vue and actively maintained, but we inherit whatever bugs it has.

## Related

- [[001-NUXT_FULL_STACK]] — implies Vue and TS.
- [[../artefacts/kickoff_audio_sync]] — source of the brand constraints.
- [[../todos/completed/CHAT_UI]] — consumer of this stack; also where the chart-library decision will land.
