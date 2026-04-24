---
type: adr
status: accepted
date: 2026-04-24
---
# ADR-007: Chart library for the chat UI

## Status
Accepted.

## Context

We need a Vue-compatible chart library for the chat UI. From [[../artefacts/kickoff_audio_sync]] the canonical shapes called out are:

- **Line chart** for trends over time
- **Bar chart** for top-N lists
- **Pie chart** for category breakdowns

Styling must comply with the NexTrade brand guide (Deep Teal, Lime accent, white cards, Inter typography) and fit alongside the rest of the UI built on shadcn-vue (see [[006-FRONTEND_TOOLING]]).

Requirements:
- Vue 3 compatible
- Can be themed to match the brand guide (ideally via CSS variables / Tailwind config)
- Covers line / bar / pie cleanly
- Doesn't impose an "enterprise dashboard" visual identity by default
- Reasonable bundle weight

Where the chart *data* originates (deterministic backend responses, AI tool output, anything else) is out of scope for this ADR.

## Options

### A. shadcn-vue Chart (unovis-vue under the hood)

- **Fit with stack:** Scaffolded by the shadcn-vue CLI into `components/ui/chart/`, same copy-in convention as the rest of the UI.
- **Theming:** Inherits the Tailwind CSS variables already used across the UI.
- **Chart coverage:** Line, bar, pie/donut, area — covers the required set.
- **Maturity:** unovis is newer and smaller than Chart.js / ECharts. Fewer examples, smaller community.
- **Weight:** Moderate. Unovis + shadcn-vue wrappers.
- **Lock-in:** Medium — we own the wrappers, but swapping renderer means rewriting them.

### B. Chart.js + vue-chartjs

- **Fit with stack:** Separate library; no shadcn-vue integration. Canvas-based (not SVG).
- **Theming:** Styling via chart options (colors, font families) — not CSS-driven, so Tailwind tokens must be bridged manually (reading CSS variables in JS).
- **Chart coverage:** All three shapes plus many more; mature defaults.
- **Maturity:** The safest, most-examples-on-the-internet option.
- **Weight:** Small-to-moderate. Chart.js is ~70KB min+gzip; tree-shakeable.
- **Lock-in:** Low — well-documented enough to swap if needed.

### C. ApexCharts + vue3-apexcharts

- **Fit with stack:** Standalone library. SVG-based. Has its own theming system.
- **Theming:** Looks good out of the box, but its default identity is distinctive; matching the NexTrade guide exactly takes override work.
- **Chart coverage:** Comprehensive, nice interactions (zoom, annotations) for free.
- **Maturity:** Well-maintained, widely used in dashboards.
- **Weight:** Moderate-to-large (~100-150KB).
- **Lock-in:** Higher — ApexCharts config is its own shape; migration requires rewrites.

### D. ECharts + vue-echarts

- **Fit with stack:** Standalone library, heaviest of the pack but also the most capable.
- **Theming:** ECharts has its own theme system; exporting brand tokens into its theme is possible but clunky.
- **Chart coverage:** Enormous — everything from basic to exotic (sankey, parallel coordinates, heatmaps).
- **Maturity:** Very mature, Apache project, enterprise-grade.
- **Weight:** Large (~400KB+ unless carefully tree-shaken).
- **Lock-in:** Higher — ECharts config shape is idiosyncratic.

### E. unovis-vue directly (no shadcn-vue wrap)

- Same renderer as Option A, without the shadcn-vue scaffolding.
- Looser fit with the rest of the UI — we write our own chart components.
- Slightly more work to set up, slightly less opinionated.

### F. D3

- Mentioned for completeness; too low-level for MVP timescales.

### G. In-house SVG (no library)

- Hand-rolled Vue component with manual scale / path / arc math for the three required shapes (line / bar / pie).
- Theming is whatever we write — straight Tailwind CSS variables on SVG elements, no library to bridge.
- Chart coverage is exactly what we build, nothing more.
- Zero dependency, zero bundle cost.
- Maturity is "as mature as we make it" — no community to lean on, no examples.
- Lock-in is high in the sense that any chart UX growth (interactivity, animations) is on us.

## Comparison

| Option | Stack fit | Theming ease | Chart coverage | Maturity | Bundle weight |
|---|---|---|---|---|---|
| A. shadcn-vue / unovis | Native | High (CSS vars) | Sufficient | Low | Moderate |
| B. Chart.js | Independent | Medium (manual bridge) | High | Very high | Small-ish |
| C. ApexCharts | Independent | Medium (fight defaults) | High | High | Moderate-large |
| D. ECharts | Independent | Low (own theme system) | Highest | Very high | Large |
| E. unovis-vue direct | Moderate | High (CSS vars) | Sufficient | Low | Moderate |
| G. In-house SVG | Native | Direct (Tailwind on SVG) | Exactly the three shapes | Whatever we write | Zero |

## Considerations for picking

- **Speed to first chart:** A and C are fastest. B close behind.
- **Brand-strict aesthetic:** A and E integrate cleanest with the Tailwind token system; B needs a small bridge; C and D need override work.
- **Risk tolerance on a young dep:** A/E carry unovis's smaller-community risk. B/C/D don't.
- **Future-proofing (exotic chart types later):** D > B > C > A/E. Only matters if we expect to need sankeys, heatmaps, or dense dashboards.
- **Bundle budget:** Matters for a chat UI that otherwise stays light; D is the outlier.

## Decision

**Option G — in-house SVG, no library.**

Three simple shapes (line / bar / pie) on a curated dataset don't need a library. A hand-rolled Vue component covers them in a few hundred lines, themes natively against the existing Tailwind CSS variables (no bridge, no wrapper), and adds zero bundle weight. For a PoC where the chart UX is "render this aggregate, label the axes" — not interactive, not animated, no exotic shapes — the dependency is overhead rather than leverage. The flaky shadcn-vue Charts docs (pages that froze in the browser during evaluation) reinforced the call: not a deal-breaker on its own, but combined with the lack of need for what the library actually provides, going library-less was the cleaner outcome.

Originally Option A was favoured for stack fit and the same brand-consistency story; in practice the in-house SVG hits the same brand consistency without the dependency. Option A remains the natural escape hatch if the chart UX ever grows.

Trade-offs accepted:
- All future chart-UX growth (hover tooltips, drill-down, animations, zoom, exotic chart types) is on us. Anything beyond the current three shapes either gets hand-rolled or triggers a swap to Option A.
- No community to crib examples from. Bug-fixing the chart math is a code-reading exercise, not a doc lookup.
- Lock-in to our own component shape — call sites are coupled to our prop surface, so a future swap means rewriting that surface to match whatever library we adopt.

## Related

- [[006-FRONTEND_TOOLING]] — the shadcn-vue + Tailwind decisions this sits on top of.
- [[../artefacts/kickoff_audio_sync]] — source of the chart-type requirements.
- [[../todos/completed/CHAT_UI]] — consumer.
