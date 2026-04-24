<script setup lang="ts">
/*
 * Tool playground — one card per registered tool. Edit args as JSON, hit Run,
 * see the raw response. Hits /api/debug/tool; no AI in the loop.
 */

useHead({ title: 'Tools · Debug' })

// Mirrors demo/db/seed-data.ts — duplicated so seeds stay server-side.
const VENDORS = [
  { id: '11111111-1111-4111-a111-111111111111', label: 'Supplier 1' },
  { id: '22222222-2222-4222-a222-222222222222', label: 'Supplier 2' },
]

type ToolSpec = {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

type RunState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'ok'; body: unknown; elapsed_ms: number }
  | { kind: 'error'; status: number; payload: unknown }

const vendorId = ref(VENDORS[0]!.id)
const { data: specData } = await useFetch<{ tools: ToolSpec[] }>(
  '/api/debug/tools',
)
const tools = computed(() => specData.value?.tools ?? [])

// Per-tool local state keyed by tool name: the args JSON (string) and last run.
const argsDraft = reactive<Record<string, string>>({})
const runs = reactive<Record<string, RunState>>({})

// Seeded defaults — the minimum that satisfies each tool's required params.
// Anything else the user can type in.
const DEFAULT_ARGS: Record<string, Record<string, unknown>> = {
  get_top_n_products: { n: 5, metric: 'revenue' },
  get_sales_trend: { granularity: 'day' },
  get_category_breakdown: {},
  get_revenue_by_region: {},
  get_order_status_mix: {},
}

watchEffect(() => {
  for (const tool of tools.value) {
    if (argsDraft[tool.name] === undefined) {
      const seed = DEFAULT_ARGS[tool.name] ?? {}
      argsDraft[tool.name] = JSON.stringify(seed, null, 2)
    }
    if (runs[tool.name] === undefined) {
      runs[tool.name] = { kind: 'idle' }
    }
  }
})

async function runTool(name: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(argsDraft[name] ?? '{}')
  } catch (err) {
    runs[name] = {
      kind: 'error',
      status: 0,
      payload: {
        error: 'invalid_json',
        message: err instanceof Error ? err.message : String(err),
      },
    }
    return
  }

  runs[name] = { kind: 'running' }
  try {
    const body = await $fetch<{ result: unknown; elapsed_ms: number }>(
      '/api/debug/tool',
      {
        method: 'POST',
        body: { name, args: parsed, vendor_id: vendorId.value },
      },
    )
    runs[name] = {
      kind: 'ok',
      body: body.result,
      elapsed_ms: body.elapsed_ms,
    }
  } catch (err: unknown) {
    const e = err as { status?: number; data?: unknown; message?: string }
    runs[name] = {
      kind: 'error',
      status: e.status ?? 0,
      payload: e.data ?? { message: e.message ?? 'request failed' },
    }
  }
}

function resetArgs(name: string) {
  const seed = DEFAULT_ARGS[name] ?? {}
  argsDraft[name] = JSON.stringify(seed, null, 2)
}

function format(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
</script>

<template>
  <main class="min-h-screen px-8 py-12">
    <div class="mx-auto flex max-w-5xl flex-col gap-10">
      <header class="flex flex-col gap-6">
        <div class="flex items-center justify-between gap-4">
          <NuxtLink
            to="/"
            class="flex items-center gap-3 rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)]"
          >
            <span
              aria-hidden="true"
              class="grid h-8 w-8 place-items-center rounded-[var(--radius-card)] bg-[color:var(--color-primary)] font-mono text-[length:var(--text-small)] font-bold text-[color:var(--color-primary-foreground)]"
            >
              NT
            </span>
            <span
              class="text-[length:var(--text-h3)] font-bold leading-none tracking-[-0.035em]"
            >
              NexTrade
            </span>
          </NuxtLink>
          <VendorSwitcher v-model="vendorId" :vendors="VENDORS" />
        </div>

        <div class="flex flex-col gap-3">
          <Label>Developer · Tools Playground</Label>
          <h1
            class="text-[length:var(--text-h2)] leading-[var(--text-h2--line-height)] font-bold tracking-[-0.04em]"
          >
            Tool playground
          </h1>
          <p
            class="max-w-2xl text-[length:var(--text-body)] leading-[var(--text-body--line-height)] text-[color:var(--color-muted-foreground)]"
          >
            Calls each registered tool directly against the DB, scoped to the
            selected vendor. Skip the AI loop, verify the SQL shape by eye.
          </p>
        </div>
      </header>

      <section class="flex flex-col gap-6">
        <div
          v-for="tool in tools"
          :key="tool.name"
          class="flex flex-col gap-3"
        >
          <Card>
            <div
              class="flex items-start justify-between gap-4 border-b border-[color:var(--color-hairline)] px-5 py-3"
            >
              <div class="flex flex-col gap-1">
                <Label>Tool</Label>
                <code
                  class="font-mono text-[length:var(--text-body)] font-semibold leading-none"
                >
                  {{ tool.name }}
                </code>
              </div>
              <Button variant="ghost" size="sm" @click="resetArgs(tool.name)">
                Reset args
              </Button>
            </div>

            <div class="flex flex-col gap-4 px-5 py-5">
              <p
                class="text-[length:var(--text-small)] leading-[var(--text-small--line-height)] text-[color:var(--color-muted-foreground)]"
              >
                {{ tool.description }}
              </p>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <Label>Args · JSON</Label>
                  <textarea
                    v-model="argsDraft[tool.name]"
                    rows="6"
                    spellcheck="false"
                    class="rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-background)] px-3 py-2 font-mono text-[length:var(--text-small)] leading-[var(--text-small--line-height)] outline-none focus:ring-4 focus:ring-[color:var(--color-ring)]"
                  />
                  <details
                    class="text-[length:var(--text-small)] text-[color:var(--color-muted-foreground)]"
                  >
                    <summary class="cursor-pointer select-none">
                      input_schema
                    </summary>
                    <pre
                      class="mt-2 overflow-x-auto rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-background)] px-3 py-2 font-mono text-[length:var(--text-label)] leading-[var(--text-small--line-height)]"
                    ><code>{{ format(tool.input_schema) }}</code></pre>
                  </details>
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <Label>Response</Label>
                    <span
                      v-if="runs[tool.name]?.kind === 'ok'"
                      class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]"
                    >
                      {{ (runs[tool.name] as { elapsed_ms: number }).elapsed_ms }} ms
                    </span>
                  </div>
                  <pre
                    class="min-h-[10rem] overflow-x-auto rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-background)] px-3 py-2 font-mono text-[length:var(--text-small)] leading-[var(--text-small--line-height)]"
                  ><code v-if="runs[tool.name]?.kind === 'idle'" class="text-[color:var(--color-muted-foreground)]">— not run yet —</code><code v-else-if="runs[tool.name]?.kind === 'running'" class="text-[color:var(--color-muted-foreground)]">running…</code><code v-else-if="runs[tool.name]?.kind === 'ok'">{{ format((runs[tool.name] as { body: unknown }).body) }}</code><code v-else-if="runs[tool.name]?.kind === 'error'" class="text-[color:var(--color-muted-foreground)]">HTTP {{ (runs[tool.name] as { status: number }).status }}
{{ format((runs[tool.name] as { payload: unknown }).payload) }}</code></pre>
                </div>
              </div>
            </div>

            <div
              class="flex items-center justify-between border-t border-[color:var(--color-hairline)] px-5 py-3"
            >
              <Label>
                Scoped to {{ VENDORS.find((v) => v.id === vendorId)?.label }}
              </Label>
              <Button
                variant="primary"
                size="sm"
                :disabled="runs[tool.name]?.kind === 'running'"
                @click="runTool(tool.name)"
              >
                {{ runs[tool.name]?.kind === 'running' ? 'Running…' : 'Run' }}
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  </main>
</template>
