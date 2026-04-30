---
type: todo
status: done
description: Build brand-aligned Card, AI Chat, and Button primitives on shadcn-vue
---
# Components

Part of [[../STYLE_GUIDE]]. Source: `docs/artefacts/Style Guide_3.png`.

## Problem

The brand guide specifies three component families: Card, AI Chat surface, and Button variants. They need to exist as shadcn-vue components styled with the brand tokens from [[01-COLORS]] and [[02-TYPOGRAPHY]] — no hex or pixel literals in the component code.

## Components

### Card
- Radius: 4px
- Shadow: `0 8px 24px rgba(0,0,0,0.08)`
- Border: 1px hairline (`#E5E7EB` — to be tokenised as `border-hairline`)
- Surface: white
- Used for shipment cards, chat message cards, chart containers

### AI Chat
- NexTrade AI header with lime assistant indicator
- User query bubble: almost-black surface, white text
- AI response card: white surface, lime left-border accent
- Input with placeholder "Ask NexTrade AI anything..."
- Keyboard hints: "ENTER TO SEND • SHIFT + ENTER NEWLINE"
- Status indicator: "AI READY"
- Focus ring: `#008080` at 12% opacity
- AI marker: `#39FF14`
- Card/input radius: 4px

### Buttons
- Primary — Deep Teal fill, white text
- Secondary — white surface, 1px border
- Ghost — transparent, no border
- AI Generate — lime fill with inline AI indicator dot

## Approach

- Scaffold `<Card>`, `<Button>`, and chat primitives (`<ChatShell>`, `<ChatMessage>`, `<ChatInput>`) via the shadcn-vue CLI where components exist; hand-roll the rest on reka-ui primitives
- Every color/typography reference resolves through Tailwind config; no raw hex or px
- Focus and keyboard semantics inherit from reka-ui
- Expect to split this todo when work starts — at least Card / Buttons / Chat shell / Chat message / Chat input will each want their own file

## What Was Done

Hand-rolled on native elements rather than scaffolded through the shadcn-vue CLI — ADR-006 explicitly allows this, and the components we needed (Card, Button, chat surface) don't require reka-ui's focus/overlay machinery yet. `reka-ui` is installed and ready for CHAT_UI follow-ups that need dropdowns (vendor switcher) or dialogs.

Components under `demo/app/components/`:

- `ui/Button.vue` — `cva` variants: `primary` (teal), `secondary` (hairline), `ghost`, `ai` (lime fill with inline indicator dot). Sizes sm/md/lg. Focus ring resolves to `--color-ring`.
- `ui/Card.vue` — 4px radius, `--shadow-card`, hairline border. Accepts `as` prop for semantic elements.
- `ui/Label.vue` — uppercase monospace 11px meta label used for all "SHIPMENT · 00412-8"-style text.
- `chat/ChatShell.vue` — header (assistant dot + title + status label), scrollable message area, `#input` slot footer. Composes the Card primitive.
- `chat/ChatMessage.vue` — `role` prop switches between almost-black user bubble and white AI card with lime left-border accent.
- `chat/ChatInput.vue` — textarea + send button; Enter submits, Shift+Enter newlines; keyboard hints and "AI Ready" indicator rendered below.

Every color/size reference resolves through a token — grep for `#` or `px` in `components/` returns nothing but the docblock comment in `Button.vue` about focus-ring opacity.

`cn()` helper lives at `app/utils/cn.ts` (clsx + tailwind-merge) and is globally auto-imported by Nuxt, so components use it without a local `import`.
