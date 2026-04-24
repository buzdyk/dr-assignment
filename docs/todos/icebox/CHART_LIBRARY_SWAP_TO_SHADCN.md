---
type: todo
status: icebox
description: Replace the hand-rolled SVG ResultChart with shadcn-vue Chart on unovis-vue
reason: ADR-007 was amended to ratify the in-house SVG choice (Option G) — three chart shapes on a curated dataset don't justify a library; thaw only when the chart UX needs interactivity, animations, or shapes the SVG can't easily give us
---
# Chart library: swap to shadcn-vue Chart

## Problem

The chat UI ships with a hand-rolled SVG component (`demo/app/components/chat/ResultChart.vue`) for bar / line / pie. [[../../adr/007-CHART_LIBRARY]] now ratifies that as Option G; this todo is the fallback path if/when the chart UX outgrows what the SVG can comfortably do.

## Approach

- Scaffold shadcn-vue Chart components into `components/ui/chart/` via the shadcn CLI, plus the unovis-vue dependency it pulls in.
- Reimplement bar / line / pie inside `ResultChart.vue` against the shadcn-vue Chart components, keeping the same prop surface (`kind`, `xKey`, `yKey`, `rows`) so call sites don't change.
- Brand tokens flow through Tailwind CSS variables, which the shadcn-vue Chart wrappers consume natively — no per-chart styling needed.
- Remove the manual scale / path / arc math in the current component.
- Verify bundle delta and confirm responsive behaviour matches what shipped.

If the shadcn-vue Charts docs are still flaky when this is picked up, fall back to Option E in the ADR (unovis-vue directly) — same renderer, no wrapper layer.

## Triggers to thaw

- Hover tooltips, drill-down, or animations become a real product ask.
- A chart shape outside the current three (line / bar / pie) is needed.
- The hand-rolled SVG math becomes a maintenance burden — multiple bug fixes pile up around scaling, axis labelling, or aspect ratios.
- Bundle weight stops being a consideration (e.g. the rest of the app gains heavy deps anyway).

## Related

- [[../../adr/007-CHART_LIBRARY]] — the amended decision (Option G chosen, this is the documented fallback)
- [[../completed/CHAT_UI]] — the consumer where this was originally bundled
