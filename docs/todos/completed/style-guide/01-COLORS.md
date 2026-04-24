---
type: todo
status: done
description: Wire NexTrade brand colors into Tailwind config as design tokens
---
# Colors

Part of [[../STYLE_GUIDE]]. Source: `docs/artefacts/Style Guide_1.png`.

## Problem

The brand defines six color tokens the UI must use consistently. They need to live as Tailwind config entries (and CSS variables, for shadcn-vue's token system) so every component resolves to them automatically and no hex literals leak into components.

## Tokens

| Role | Hex | Usage per brand guide |
|------|-----|------------------------|
| Primary Brand | `#008080` | Deep Teal — headers, primary buttons, main navigation |
| Accent / AI Highlight | `#39FF14` | Neon Lime — AI output, loading states, critical highlights (used sparingly) |
| Background — App | `#FBF9FA` | Off-White — page background |
| Background — Surface | `#FFFFFF` | White — cards, chat surfaces |
| Text — Primary | `#1A1A1A` | Almost Black — body/content text |
| Text — Muted | `#AC7570` | Cool Gray — metadata, secondary text |

## Approach

- Add entries under `theme.extend.colors` in `tailwind.config.ts`
- Mirror as CSS variables (`--color-primary`, `--color-accent`, `--color-background`, etc.) to feed shadcn-vue's token convention
- Override any shadcn-vue preset grays that conflict with the NexTrade palette
- Lint / grep rule against raw hex values in component files

## Related

- [[../STYLE_GUIDE]]
- [[../../../adr/006-FRONTEND_TOOLING]]

## What Was Done

All six brand tokens landed as Tailwind v4 `@theme` entries in `demo/app/assets/css/app.css`, which is the single source of truth. Tokens are consumed in components via `var(--color-*)` arbitrary values (`bg-[color:var(--color-primary)]` etc.), so no hex literal appears in any `.vue` file outside the style-guide demo page's docblock. The focus-ring token is derived from the primary color at 12% via `color-mix`, matching the brand spec.

Stack diverged slightly from the original todo: we went with Tailwind v4 (CSS-based `@theme`) instead of v3's `tailwind.config.ts`. The intent of the ADR — one source of truth, token-enforced styling — is preserved; the tokens just live in CSS now. ADR-006 stands but the specific `tailwind.config.ts` reference is legacy.
