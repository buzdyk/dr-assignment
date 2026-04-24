<script setup lang="ts">
useHead({ title: 'Chat · NexTrade' })

// Mirrors demo/db/seed-data.ts (SUPPLIER_1_ID / SUPPLIER_2_ID) — duplicated
// here so the seed module stays server-side and isn't bundled into the client.
const VENDORS = [
  { id: '11111111-1111-4111-a111-111111111111', label: 'Supplier 1' },
  { id: '22222222-2222-4222-a222-222222222222', label: 'Supplier 2' },
]

const vendorId = ref('11111111-1111-4111-a111-111111111111')
const debug = ref(false)

type FilterChip = { label: string; value: string }
type ChartHint = { kind: 'bar' | 'line' | 'pie'; x: string; y: string }

type ToolBlock = {
  kind: 'tool'
  name: string
  args: unknown
  status: 'pending' | 'done' | 'error'
  overview?: string
  filters?: FilterChip[]
  rows?: unknown[]
  chart?: ChartHint
}
type TextBlock = { kind: 'text'; text: string }
type ErrorBlock = { kind: 'error'; message: string }
type AssistantBlock = ToolBlock | TextBlock | ErrorBlock

type UserMessage = { role: 'user'; text: string }
type AssistantMessage = { role: 'assistant'; blocks: AssistantBlock[] }
type Message = UserMessage | AssistantMessage

// Per-vendor chat windows: conversations, drafts, and busy state are all keyed
// by vendor id so switching the supplier restores that tab's state verbatim.
const conversations = reactive<Record<string, Message[]>>({})
const drafts = reactive<Record<string, string>>({})
const busyByVendor = reactive<Record<string, boolean>>({})

function ensureWindow(id: string) {
  if (!conversations[id]) conversations[id] = reactive<Message[]>([])
  if (drafts[id] === undefined) drafts[id] = ''
}

const conversation = computed<Message[]>(() => {
  ensureWindow(vendorId.value)
  return conversations[vendorId.value]!
})
const draft = computed<string>({
  get: () => {
    ensureWindow(vendorId.value)
    return drafts[vendorId.value]!
  },
  set: (v) => {
    ensureWindow(vendorId.value)
    drafts[vendorId.value] = v
  },
})
const busy = computed<boolean>(() => !!busyByVendor[vendorId.value])

const turns = computed(() => {
  const out: { user: UserMessage; assistant: AssistantMessage | null }[] = []
  for (const msg of conversation.value) {
    if (msg.role === 'user') {
      out.push({ user: msg, assistant: null })
    } else {
      const last = out[out.length - 1]
      if (last) last.assistant = msg
    }
  }
  return out
})

const shell = useTemplateRef<{ scrollEl: HTMLElement | null }>('shell')
const turnHeight = ref(0)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const el = shell.value?.scrollEl
  if (!el) return
  turnHeight.value = el.clientHeight
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) turnHeight.value = entry.contentRect.height
  })
  resizeObserver.observe(el)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

async function onSubmit(prompt: string) {
  // Bind this turn to the vendor that submitted it — if the user switches
  // suppliers mid-stream, SSE events keep landing in the originating window.
  const vid = vendorId.value
  if (busyByVendor[vid]) return
  busyByVendor[vid] = true

  ensureWindow(vid)
  const target = conversations[vid]!
  target.push({ role: 'user', text: prompt })
  const assistant: AssistantMessage = reactive({
    role: 'assistant',
    blocks: [],
  }) as AssistantMessage
  target.push(assistant)
  drafts[vid] = ''

  await nextTick()
  if (vendorId.value === vid) {
    const nodes = document.querySelectorAll<HTMLElement>('[data-turn]')
    nodes[nodes.length - 1]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt,
        vendor_id: vid,
        debug: debug.value,
      }),
    })

    if (!res.ok || !res.body) {
      const payload = await res.json().catch(() => ({}))
      assistant.blocks.push({
        kind: 'error',
        message:
          (payload as { data?: { message?: string } })?.data?.message ??
          `Request failed: ${res.status}`,
      })
      return
    }

    await consumeSSE(res.body, (event) => applyEvent(assistant, event))
  } catch (err) {
    assistant.blocks.push({
      kind: 'error',
      message: err instanceof Error ? err.message : String(err),
    })
  } finally {
    busyByVendor[vid] = false
  }
}

type ChatEvent =
  | { type: 'tool_start'; name: string; args: unknown }
  | ({
      type: 'tool_result'
      name: string
      args: unknown
      is_error?: boolean
      overview: string
      filters: FilterChip[]
      rows: unknown[]
      chart: ChartHint
    })
  | { type: 'text'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

function applyEvent(assistant: AssistantMessage, event: ChatEvent) {
  if (event.type === 'tool_start') {
    assistant.blocks.push({
      kind: 'tool',
      name: event.name,
      args: event.args,
      status: 'pending',
    })
  } else if (event.type === 'tool_result') {
    const pending = [...assistant.blocks]
      .reverse()
      .find(
        (b): b is ToolBlock =>
          b.kind === 'tool' && b.status === 'pending' && b.name === event.name,
      )
    const block = pending ?? ({ kind: 'tool', name: event.name, args: event.args, status: 'pending' } as ToolBlock)
    if (!pending) assistant.blocks.push(block)
    block.overview = event.overview
    block.filters = event.filters
    block.rows = event.rows
    block.chart = event.chart
    block.status = event.is_error ? 'error' : 'done'
  } else if (event.type === 'text') {
    const last = assistant.blocks.at(-1)
    if (last && last.kind === 'text') {
      last.text += event.text
    } else {
      assistant.blocks.push({ kind: 'text', text: event.text })
    }
  } else if (event.type === 'error') {
    assistant.blocks.push({ kind: 'error', message: event.message })
  }
}

async function consumeSSE(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatEvent) => void,
) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      const data = parseFrameData(frame)
      if (data) {
        try {
          onEvent(JSON.parse(data) as ChatEvent)
        } catch {
          /* ignore malformed */
        }
      }
    }
  }
}

function parseFrameData(frame: string): string | null {
  const lines = frame.split('\n')
  const dataLines = lines
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).replace(/^ /, ''))
  return dataLines.length ? dataLines.join('\n') : null
}
</script>

<template>
  <main class="flex h-dvh flex-col bg-[color:var(--color-background)]">
    <!-- Top bar ── brand -->
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
        <ChatShell ref="shell" title="">
          <template #header-actions>
            <VendorSwitcher v-model="vendorId" :vendors="VENDORS" />
          </template>
          <div class="flex flex-col gap-6">
            <div
              v-for="(turn, i) in turns"
              :key="i"
              data-turn
              class="flex flex-col gap-6"
              :style="turnHeight ? { minHeight: turnHeight + 'px' } : undefined"
            >
              <ChatMessage role="user">{{ turn.user.text }}</ChatMessage>

              <ChatMessage v-if="turn.assistant" role="assistant">
                <div class="flex flex-col gap-3">
                  <p
                    v-if="turn.assistant.blocks.length === 0"
                    class="font-mono text-[length:var(--text-label)] uppercase tracking-[0.08em] text-[color:var(--color-muted-foreground)]"
                  >
                    thinking…
                  </p>

                  <template
                    v-for="(block, j) in turn.assistant.blocks"
                    :key="`text-${j}`"
                  >
                    <p
                      v-if="block.kind === 'text'"
                      class="text-[length:var(--text-body)] leading-[var(--text-body--line-height)] whitespace-pre-wrap"
                    >
                      {{ block.text }}
                    </p>
                    <p
                      v-else-if="block.kind === 'error'"
                      class="rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-background)] px-3 py-2 text-[length:var(--text-small)] text-[color:var(--color-destructive,#c0392b)]"
                    >
                      {{ block.message }}
                    </p>
                  </template>

                  <template
                    v-for="(block, j) in turn.assistant.blocks"
                    :key="`tool-${j}`"
                  >
                    <div
                      v-if="block.kind === 'tool'"
                      class="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-background)] px-3 py-2"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <Label>{{ block.name }}</Label>
                        <Label>{{ block.status }}</Label>
                      </div>
                      <p
                        v-if="block.overview"
                        class="text-[length:var(--text-small)]"
                      >
                        {{ block.overview }}
                      </p>
                      <ResultChart
                        v-if="block.status === 'done' && block.chart && block.rows && block.rows.length"
                        :kind="block.chart.kind"
                        :x-key="block.chart.x"
                        :y-key="block.chart.y"
                        :rows="block.rows"
                      />
                    </div>
                  </template>
                </div>
              </ChatMessage>
            </div>
          </div>

          <template #input>
            <ChatInput
              v-model="draft"
              v-model:debug="debug"
              :disabled="busy"
              @submit="onSubmit"
            />
          </template>
        </ChatShell>
      </div>
    </section>
  </main>
</template>
