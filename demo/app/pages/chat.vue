<script setup lang="ts">
useHead({ title: 'Chat · NexTrade' })

// Mirrors demo/db/seed-data.ts (SUPPLIER_1_ID / SUPPLIER_2_ID) — duplicated
// here so the seed module stays server-side and isn't bundled into the client.
const VENDORS = [
  { id: '11111111-1111-4111-a111-111111111111', label: 'Supplier 1' },
  { id: '22222222-2222-4222-a222-222222222222', label: 'Supplier 2' },
]

const vendorId = ref('11111111-1111-4111-a111-111111111111')
const draft = ref('')

type UserMessage = { role: 'user'; text: string }
type AssistantMessage = {
  role: 'assistant'
  blocks: Array<
    | { kind: 'text'; text: string }
    | {
        kind: 'table'
        caption: string
        columns: string[]
        rows: Array<Array<string>>
      }
    | { kind: 'chart-placeholder'; caption: string; chartType: 'bar' | 'line' | 'pie' }
    | { kind: 'delta'; metric: string; a: { label: string; value: string }; b: { label: string; value: string }; delta: string }
  >
}
type Message = UserMessage | AssistantMessage

const conversation: Message[] = [
  {
    role: 'user',
    text: 'What are my top 5 products by revenue this last month?',
  },
  {
    role: 'assistant',
    blocks: [
      {
        kind: 'text',
        text: 'Top 5 products by revenue for the last 30 days (Mar 25 – Apr 24).',
      },
      {
        kind: 'table',
        caption: 'get_top_n_products · metric=revenue · n=5',
        columns: ['Product', 'Category', 'Revenue'],
        rows: [
          ['Red Widget', 'Widgets', '$48,920'],
          ['Blue Gizmo', 'Gizmos', '$41,310'],
          ['Green Gadget', 'Gadgets', '$36,275'],
          ['Yellow Thingamajig', 'Thingamajigs', '$29,840'],
          ['Black Widget', 'Widgets', '$24,015'],
        ],
      },
      {
        kind: 'chart-placeholder',
        caption: 'Bar chart — revenue by product',
        chartType: 'bar',
      },
    ],
  },
  {
    role: 'user',
    text: 'How many red widgets did I sell on Tuesday vs Wednesday?',
  },
  {
    role: 'assistant',
    blocks: [
      {
        kind: 'text',
        text: 'Comparing Red Widget unit sales between the two days.',
      },
      {
        kind: 'delta',
        metric: 'quantity',
        a: { label: 'Tue · Apr 21', value: '24 units' },
        b: { label: 'Wed · Apr 22', value: '31 units' },
        delta: '+7 · +29.2%',
      },
    ],
  },
  {
    role: 'user',
    text: 'Why are my cancellation rates so high this week?',
  },
  {
    role: 'assistant',
    blocks: [
      {
        kind: 'text',
        text: 'I don’t have data on why customers cancel orders — only that they do. The checkout flow doesn’t capture a reason.',
      },
      {
        kind: 'text',
        text: 'Your cancellation rate this week is 12.3% (14 of 114 orders). I can show the trend over the last 30 days or break it down by day if that helps.',
      },
    ],
  },
]
</script>

<template>
  <main class="flex h-dvh flex-col bg-[color:var(--color-background)]">
    <!-- Top bar ── brand + vendor switcher -->
    <header
      class="flex items-center justify-between gap-4 border-b border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-6 py-3"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)] rounded-[var(--radius-card)]"
      >
        <span
          aria-hidden="true"
          class="grid h-8 w-8 place-items-center rounded-[var(--radius-card)] bg-[color:var(--color-primary)] font-mono text-[length:var(--text-small)] font-bold text-[color:var(--color-primary-foreground)]"
        >
          NT
        </span>
        <span
          class="text-[length:var(--text-h3)] leading-none font-bold tracking-[-0.035em]"
        >
          NexTrade
        </span>
      </NuxtLink>

      <VendorSwitcher v-model="vendorId" :vendors="VENDORS" />
    </header>

    <!-- Page header — style-guide pattern: small Label + tagline H2 with teal accent -->
    <section class="px-6 pt-8 pb-5">
      <div class="mx-auto flex max-w-4xl flex-col gap-3">
        <Label>NexTrade AI · Chat</Label>
        <h1
          class="text-[length:var(--text-h2)] leading-[var(--text-h2--line-height)] font-bold tracking-[-0.04em]"
        >
          Ask your
          <span class="text-[color:var(--color-primary)]">data</span>
          anything.
        </h1>
      </div>
    </section>

    <!-- Chat surface — consumes the rest of the viewport -->
    <section class="flex-1 min-h-0 px-6 pb-6">
      <div class="mx-auto flex h-full max-w-4xl flex-col">
        <ChatShell title="">
          <div class="flex flex-col gap-6">
            <template v-for="(msg, i) in conversation" :key="i">
              <ChatMessage v-if="msg.role === 'user'" role="user">
                {{ msg.text }}
              </ChatMessage>

              <ChatMessage v-else role="assistant">
                <div class="flex flex-col gap-4">
                  <template v-for="(block, j) in msg.blocks" :key="j">
                    <p
                      v-if="block.kind === 'text'"
                      class="text-[length:var(--text-body)] leading-[var(--text-body--line-height)]"
                    >
                      {{ block.text }}
                    </p>

                    <div v-else-if="block.kind === 'table'" class="flex flex-col gap-2">
                      <Label>{{ block.caption }}</Label>
                      <div
                        class="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-hairline)]"
                      >
                        <table class="w-full border-collapse">
                          <thead class="bg-[color:var(--color-background)]">
                            <tr>
                              <th
                                v-for="col in block.columns"
                                :key="col"
                                class="px-3 py-2 text-left font-mono text-[length:var(--text-label)] uppercase tracking-[0.08em] text-[color:var(--color-muted-foreground)]"
                              >
                                {{ col }}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(row, rIdx) in block.rows"
                              :key="rIdx"
                              class="border-t border-[color:var(--color-hairline)]"
                            >
                              <td
                                v-for="(cell, cIdx) in row"
                                :key="cIdx"
                                :class="cn(
                                  'px-3 py-2 text-[length:var(--text-small)]',
                                  cIdx === row.length - 1 ? 'text-right font-mono' : '',
                                )"
                              >
                                {{ cell }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div
                      v-else-if="block.kind === 'chart-placeholder'"
                      class="flex flex-col gap-2"
                    >
                      <Label>{{ block.caption }}</Label>
                      <div
                        class="grid h-48 place-items-center rounded-[var(--radius-card)] border border-dashed border-[color:var(--color-hairline)] bg-[color:var(--color-background)]"
                      >
                        <div class="flex flex-col items-center gap-1">
                          <span
                            class="font-mono text-[length:var(--text-label)] uppercase tracking-[0.08em] text-[color:var(--color-muted-foreground)]"
                          >
                            {{ block.chartType }} chart · pending ADR-007
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      v-else-if="block.kind === 'delta'"
                      class="flex flex-col gap-2"
                    >
                      <Label>compare_days · metric={{ block.metric }}</Label>
                      <div
                        class="grid grid-cols-3 gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-background)] px-4 py-3"
                      >
                        <div class="flex flex-col gap-1">
                          <Label>{{ block.a.label }}</Label>
                          <span
                            class="font-mono text-[length:var(--text-h3)] font-bold leading-none"
                          >
                            {{ block.a.value }}
                          </span>
                        </div>
                        <div class="flex flex-col gap-1">
                          <Label>{{ block.b.label }}</Label>
                          <span
                            class="font-mono text-[length:var(--text-h3)] font-bold leading-none"
                          >
                            {{ block.b.value }}
                          </span>
                        </div>
                        <div class="flex flex-col gap-1">
                          <Label>Delta</Label>
                          <span
                            class="font-mono text-[length:var(--text-h3)] font-bold leading-none text-[color:var(--color-primary)]"
                          >
                            {{ block.delta }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </ChatMessage>
            </template>
          </div>

          <template #input>
            <ChatInput v-model="draft" />
          </template>
        </ChatShell>
      </div>
    </section>
  </main>
</template>
