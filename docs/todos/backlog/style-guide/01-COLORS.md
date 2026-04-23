---
type: todo
status: backlog
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
