---
type: epic
status: backlog
description: Translate the NexTrade brand guide into Tailwind tokens and shadcn-vue components
---
# Style Guide Implementation

Translation of the three NexTrade brand-guide images (`docs/artefacts/Style Guide_1.png`, `Style Guide_2.png`, `Style Guide_3.png`) into concrete implementation work.

## Todos

| # | Todo | Source |
|---|------|--------|
| 01 | [[style-guide/01-COLORS]] | Style Guide_1.png — colors |
| 02 | [[style-guide/02-TYPOGRAPHY]] | Style Guide_2.png — typography |
| 03 | [[style-guide/03-COMPONENTS]] | Style Guide_3.png — UI components |

## Scope

- **Colors** → brand tokens (primary, accent, backgrounds, text) as Tailwind config entries + CSS variables.
- **Typography** → Inter type scale, three header rules, body/mono treatment.
- **Components** → Card, AI Chat surface, Button variants built on shadcn-vue + reka-ui, restyled with the brand tokens above.

## Related

- [[../../adr/006-FRONTEND_TOOLING]] — the Vue + Tailwind + shadcn-vue stack these tokens and components build on.
- [[../../artefacts/kickoff_audio_sync]] — Sarah's brand-strict constraint this epic exists to honor.
