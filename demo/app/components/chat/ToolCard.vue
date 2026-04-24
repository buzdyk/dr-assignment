<script setup lang="ts">
import { ChevronDown, ChevronRight, Download } from 'lucide-vue-next'
import { computed, ref } from 'vue'

type ChartHint = { kind: 'bar' | 'line' | 'pie'; x: string; y: string }

type Props = {
  name: string
  status: 'pending' | 'done' | 'error'
  overview?: string
  rows?: unknown[]
  chart?: ChartHint
}

const props = defineProps<Props>()

const userToggled = ref<boolean | null>(null)
const expanded = computed({
  get() {
    if (userToggled.value !== null) return userToggled.value
    return !props.chart
  },
  set(v) {
    userToggled.value = v
  },
})

const ROW_LIMIT = 200

const rows = computed(() => (props.rows ?? []) as Record<string, unknown>[])
const hasRows = computed(() => props.status === 'done' && rows.value.length > 0)
const columns = computed(() =>
  rows.value.length ? Object.keys(rows.value[0]!) : [],
)
const visibleRows = computed(() => rows.value.slice(0, ROW_LIMIT))
const overflow = computed(() => Math.max(0, rows.value.length - ROW_LIMIT))

const numericColumns = computed(() => {
  const cols = columns.value
  const sample = rows.value.slice(0, 10)
  return new Set(
    cols.filter((col) =>
      sample.every((r) => {
        const v = r[col]
        if (v === null || v === undefined || v === '') return true
        return typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v))
      }),
    ),
  )
})

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2)
  return String(v)
}

function escapeCSV(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'number' ? String(v) : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function rowsToCSV(): string {
  const cols = columns.value
  if (cols.length === 0) return ''
  const header = cols.join(',')
  const body = rows.value
    .map((r) => cols.map((c) => escapeCSV(r[c])).join(','))
    .join('\n')
  return `${header}\n${body}\n`
}

function downloadCSV() {
  const csv = rowsToCSV()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.name}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-background)] px-3 py-2"
  >
    <div class="flex items-center justify-between gap-3">
      <Label>{{ name }}</Label>
      <Label>{{ status }}</Label>
    </div>

    <p v-if="overview" class="text-[length:var(--text-small)]">
      {{ overview }}
    </p>

    <ResultChart
      v-if="status === 'done' && chart && rows && rows.length"
      :kind="chart.kind"
      :x-key="chart.x"
      :y-key="chart.y"
      :rows="rows"
    />

    <div
      v-if="hasRows"
      class="flex flex-wrap items-center justify-between gap-2 pt-1"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1 font-mono text-[length:var(--text-label)] uppercase tracking-[0.08em] text-[color:var(--color-muted-foreground)] transition-colors hover:text-[color:var(--color-foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)] rounded-[var(--radius-card)]"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <component :is="expanded ? ChevronDown : ChevronRight" :size="12" :stroke-width="2.5" />
        {{ expanded ? 'hide' : 'show' }} data · {{ rows.length }} {{ rows.length === 1 ? 'row' : 'rows' }}
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 font-mono text-[length:var(--text-label)] uppercase tracking-[0.08em] text-[color:var(--color-muted-foreground)] transition-colors hover:text-[color:var(--color-foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)] rounded-[var(--radius-card)]"
        @click="downloadCSV"
      >
        <Download :size="12" :stroke-width="2.5" />
        download csv
      </button>
    </div>

    <div
      v-if="expanded && hasRows"
      class="overflow-x-auto rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)]"
    >
      <table class="w-full border-collapse text-[length:var(--text-small)]">
        <thead>
          <tr class="border-b border-[color:var(--color-hairline)]">
            <th
              v-for="col in columns"
              :key="col"
              class="px-3 py-1.5 text-left font-mono text-[length:var(--text-label)] uppercase tracking-[0.08em] font-medium text-[color:var(--color-muted-foreground)]"
              :class="numericColumns.has(col) ? 'text-right' : ''"
            >
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in visibleRows"
            :key="i"
            class="border-b border-[color:var(--color-hairline)] last:border-b-0 even:bg-[color:var(--color-background)]"
          >
            <td
              v-for="col in columns"
              :key="col"
              class="px-3 py-1.5 align-top"
              :class="numericColumns.has(col) ? 'text-right tabular-nums' : ''"
            >
              {{ formatCell(row[col]) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-if="overflow > 0"
        class="border-t border-[color:var(--color-hairline)] px-3 py-1.5 font-mono text-[length:var(--text-label)] uppercase tracking-[0.08em] text-[color:var(--color-muted-foreground)]"
      >
        and {{ overflow }} more — download csv for full data
      </p>
    </div>
  </div>
</template>
