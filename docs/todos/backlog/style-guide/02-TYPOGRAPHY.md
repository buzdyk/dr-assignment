---
type: todo
status: backlog
description: Wire Inter type scale and typography rules into Tailwind config
---
# Typography

Part of [[../STYLE_GUIDE]]. Source: `docs/artefacts/Style Guide_2.png`.

## Problem

The brand's type system is Inter-based with a specific scale, weight and line-height set, plus a monospace track for metadata. All of it needs to be available as Tailwind utilities so components never hand-roll `font-family` or ad-hoc sizes.

## System

**Headers** — Inter 700, letter-spacing -0.05em:
- H1: 60px / line-height 0.95
- H2: 36px / line-height 1
- H3: 26px / line-height 1.2

**Body** — Inter 400-500:
- Body: 15px / 1.5
- Small: 13px / 1.5
- Label: 11px / 1, uppercase

**Monospace** — system monospace stack; used for metadata, IDs, hex values (columnar alignment).

**Rules:**
- Headers use tight letter-spacing (-0.035em to -0.05em) for a geometric, engineered feel.
- Body stays at 400-500 weight with line-height 1.5-1.6 for sustained data reading.
- Metadata, IDs, and hex values use a monospaced stack.

## Approach

- Load Inter via `@nuxt/fonts` (or self-host for determinism)
- `theme.extend.fontFamily`: `sans: ['Inter', ...]`, `mono: [<system mono stack>]`
- `theme.extend.fontSize`: header and body entries as `[size, { lineHeight, letterSpacing, fontWeight }]` tuples
- Add custom utility classes if base Tailwind can't express the letter-spacing + weight combos cleanly
- Visual diff against the Style Guide image once a sample page exists

## Related

- [[../STYLE_GUIDE]]
- [[../../../adr/006-FRONTEND_TOOLING]]
