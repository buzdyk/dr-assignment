---
type: todo
status: backlog
description: Replace the hand-rolled SVG ResultChart with shadcn-vue Chart on unovis-vue, per ADR-007, or amend the ADR to ratify the SVG choice
---
# Chart library: swap to unovis (or amend ADR-007)

## Problem

[[../../adr/007-CHART_LIBRARY]] decided **Option A — shadcn-vue Chart on unovis-vue** for the chat UI charts. The shipped implementation is a hand-rolled SVG component (`demo/app/components/chat/ResultChart.vue`) covering bar, line, and pie. It works and matches the brand, but the chosen library was never installed and the ADR is now silently contradicted by the code.

This needs to be reconciled in one of two directions:

1. **Implement the ADR**: install `@unovis/ts` + `@unovis/vue` (and the shadcn-vue chart wrapper), reimplement the three chart kinds against it, delete the SVG component.
2. **Amend the ADR**: add a status block to ADR-007 documenting that the in-house SVG renderer was chosen instead, with the reason (avoided a dependency for three trivial chart shapes; full control of styling; ~0 KB bundle cost).

## Approach

Decide direction first.

If **(1)** — swap to unovis:

- Add `unovis-vue` (and the supporting CSS) per the shadcn-vue Chart copy-in convention.
- Reimplement bar / line / pie inside `ResultChart.vue` against the unovis primitives, keeping the same prop surface (`kind`, `xKey`, `yKey`, `rows`) so call sites don't change.
- Wire brand tokens through Tailwind CSS variables (already supported by unovis).
- Remove all the manual scale / path / arc math in the current component.
- Verify bundle delta and confirm responsive behaviour matches what shipped.

If **(2)** — amend the ADR:

- Add a "Subsequent change" section to `docs/adr/007-CHART_LIBRARY.md` describing the SVG choice and reasoning (no dep, three simple shapes, full styling control, faster than learning the library).
- Mark the original decision superseded only if you actually do supersede it; otherwise, "implementation deviated" is honest.
- Update [[../completed/CHAT_UI]]'s line about the chart library to match.

## Why this matters

- ADRs are only useful if they reflect what was built. A silently contradicted ADR poisons the trust in the rest of them.
- Either direction is fine — the ratify path is faster and the unovis path is what the ADR currently claims. Decide based on whether the chart UX needs anything the SVG can't easily give you (interactions, zoom, animations) over the next horizon.

## Related

- [[../../adr/007-CHART_LIBRARY]] — the contradicted decision
- [[../completed/CHAT_UI]] — the consumer where this was originally bundled
- Future chart interactivity (hover tooltips, drill-down, animations) would be much cheaper on top of unovis than on top of raw SVG — relevant if direction (1) is chosen
