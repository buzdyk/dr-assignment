# Completed

Archive of finished work.

<!-- GENERATED:START -->
| Todo | Description |
|------|-------------|
| [AI_PROVIDER](./AI_PROVIDER.md) | AIProvider interface with Claude and Robot implementations |
| [BACKEND_TESTS](./BACKEND_TESTS.md) | First backend test pass — runner, DB-isolation strategy, mock provider, and a concrete coverage target across tools, runner, and SSE route |
| [BYOK_KEY_HANDLING](./BYOK_KEY_HANDLING.md) | Wire the Claude API key from a server-side env var into the Anthropic client |
| [CAPABILITIES_TOOL](./CAPABILITIES_TOOL.md) | Add a meta tool the model can call to enumerate every available tool with its description when the user asks "what can you do?" |
| [CHAT_ENDPOINT](./CHAT_ENDPOINT.md) | Primary NL→pipeline endpoint — route handler, orchestration loop, vendor-isolation boundary |
| [CHAT_PAGE](./CHAT_PAGE.md) | Full-viewport chat page layout (Sarah's kickoff constraint) — static first cut |
| [CHAT_UI](./CHAT_UI.md) | Chat UI consuming the SSE endpoint with collapsible tool cards, inline charts, and streamed summary text |
| [CLAUDE_PROVIDER_ADAPT](./CLAUDE_PROVIDER_ADAPT.md) | Adapt the Claude provider to the split pickTools / summarize interface with real token streaming |
| [DB_MIGRATIONS](./DB_MIGRATIONS.md) | Wire the NexTrade schema into Kysely migrations via kysely-ctl |
| [DB_SEEDS](./DB_SEEDS.md) | Seed two demo vendors with product/order/cancellation data rich enough for the kickoff's demo queries |
| [DOCKER_COMPOSE_SETUP](./DOCKER_COMPOSE_SETUP.md) | Add Postgres service to docker-compose and finish one-line setup docs |
| [EXPANDABLE_TOOL_CARD](./EXPANDABLE_TOOL_CARD.md) | Expand a tool card to reveal the raw rows as a table, alongside the existing overview + chart |
| [QUERY_TOOLS](./QUERY_TOOLS.md) | Predefined query tools the AI picks from — shared filter shape, one slice per tool, server-side vendor scoping |
| [SCAFFOLD_NUXT_APP](./SCAFFOLD_NUXT_APP.md) | Scaffold the Nuxt project skeleton in /demo (pages + server routes) |
| [SSE_AI_ENDPOINT](./SSE_AI_ENDPOINT.md) | SSE chat endpoint with a split provider interface, shared runner, tool envelope, and debug flag |
| [STYLE_GUIDE](./STYLE_GUIDE.md) | Translate the NexTrade brand guide into Tailwind tokens and shadcn-vue components |
<!-- GENERATED:END -->

_Regenerate with `scripts/todos-index`._
