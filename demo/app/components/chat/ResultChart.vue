<script setup lang="ts">
import { computed } from 'vue'

type Row = Record<string, unknown>

type Props = {
  kind: 'bar' | 'line' | 'pie'
  xKey: string
  yKey: string
  rows: Row[]
}

const props = defineProps<Props>()

const PALETTE = [
  '#008080',
  '#1a1a1a',
  '#ac7570',
  '#5fb3b3',
  '#7e5752',
  '#a8d8d8',
]

type Point = { label: string; value: number }

const points = computed<Point[]>(() =>
  props.rows.map((r) => ({
    label: String((r as Row)[props.xKey] ?? ''),
    value: Number((r as Row)[props.yKey] ?? 0),
  })),
)

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, notation: 'compact' })
function fmt(n: number) {
  return numberFmt.format(n)
}

const W = 600
const H = 220
const PAD = { top: 16, right: 12, bottom: 28, left: 36 }
const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom

const yMax = computed(() => {
  const m = Math.max(0, ...points.value.map((p) => p.value))
  return m === 0 ? 1 : m
})

function truncate(s: string, n = 10) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

const bars = computed(() => {
  const n = points.value.length
  const slot = innerW / Math.max(n, 1)
  const barW = Math.min(56, slot * 0.7)
  return points.value.map((p, i) => {
    const h = (p.value / yMax.value) * innerH
    const cx = PAD.left + slot * i + slot / 2
    return {
      x: cx - barW / 2,
      y: PAD.top + innerH - h,
      w: barW,
      h,
      labelX: cx,
      label: p.label,
      value: p.value,
    }
  })
})

const linePath = computed(() => {
  const n = points.value.length
  if (n === 0) return ''
  const step = innerW / Math.max(n - 1, 1)
  return points.value
    .map((p, i) => {
      const x = PAD.left + (n === 1 ? innerW / 2 : step * i)
      const y = PAD.top + innerH - (p.value / yMax.value) * innerH
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})

const lineDots = computed(() => {
  const n = points.value.length
  const step = innerW / Math.max(n - 1, 1)
  return points.value.map((p, i) => ({
    cx: PAD.left + (n === 1 ? innerW / 2 : step * i),
    cy: PAD.top + innerH - (p.value / yMax.value) * innerH,
    label: p.label,
    value: p.value,
  }))
})

const lineXTicks = computed(() => {
  const n = points.value.length
  if (n === 0) return []
  const step = innerW / Math.max(n - 1, 1)
  const indices = n <= 6 ? points.value.map((_, i) => i) : [0, Math.floor(n / 2), n - 1]
  return indices.map((i) => ({
    x: PAD.left + (n === 1 ? innerW / 2 : step * i),
    label: points.value[i]!.label,
  }))
})

const yTicks = computed(() => {
  const max = yMax.value
  const ticks = [0, max / 2, max]
  return ticks.map((v) => ({
    v,
    y: PAD.top + innerH - (v / max) * innerH,
  }))
})

const pieTotal = computed(() => points.value.reduce((a, p) => a + p.value, 0))

const pieSlices = computed(() => {
  const total = pieTotal.value
  if (total <= 0) return []
  const cx = 110
  const cy = 110
  const rOuter = 96
  const rInner = 56
  let acc = 0
  return points.value.map((p, i) => {
    const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2
    acc += p.value
    const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2
    const large = endAngle - startAngle > Math.PI ? 1 : 0
    const x1 = cx + rOuter * Math.cos(startAngle)
    const y1 = cy + rOuter * Math.sin(startAngle)
    const x2 = cx + rOuter * Math.cos(endAngle)
    const y2 = cy + rOuter * Math.sin(endAngle)
    const xi2 = cx + rInner * Math.cos(endAngle)
    const yi2 = cy + rInner * Math.sin(endAngle)
    const xi1 = cx + rInner * Math.cos(startAngle)
    const yi1 = cy + rInner * Math.sin(startAngle)
    const d = [
      `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      `L ${xi2.toFixed(1)} ${yi2.toFixed(1)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${xi1.toFixed(1)} ${yi1.toFixed(1)}`,
      'Z',
    ].join(' ')
    const pct = (p.value / total) * 100
    return {
      d,
      color: PALETTE[i % PALETTE.length],
      label: p.label,
      value: p.value,
      pct,
    }
  })
})
</script>

<template>
  <figure class="w-full">
    <svg
      v-if="kind === 'bar'"
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-auto"
      role="img"
      :aria-label="`Bar chart of ${yKey} by ${xKey}`"
    >
      <line
        v-for="t in yTicks"
        :key="`g-${t.v}`"
        :x1="PAD.left"
        :x2="W - PAD.right"
        :y1="t.y"
        :y2="t.y"
        stroke="var(--color-hairline)"
        stroke-dasharray="2 3"
      />
      <text
        v-for="t in yTicks"
        :key="`yt-${t.v}`"
        :x="PAD.left - 6"
        :y="t.y + 3"
        text-anchor="end"
        font-size="10"
        fill="var(--color-muted-foreground)"
        font-family="var(--font-mono)"
      >
        {{ fmt(t.v) }}
      </text>

      <g v-for="(b, i) in bars" :key="i">
        <rect
          :x="b.x"
          :y="b.y"
          :width="b.w"
          :height="b.h"
          fill="var(--color-primary)"
          rx="2"
        />
        <text
          :x="b.labelX"
          :y="b.y - 4"
          text-anchor="middle"
          font-size="10"
          fill="var(--color-foreground)"
          font-family="var(--font-mono)"
        >
          {{ fmt(b.value) }}
        </text>
        <text
          :x="b.labelX"
          :y="H - 10"
          text-anchor="middle"
          font-size="10"
          fill="var(--color-muted-foreground)"
          font-family="var(--font-mono)"
        >
          {{ truncate(b.label) }}
        </text>
      </g>
    </svg>

    <svg
      v-else-if="kind === 'line'"
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-auto"
      role="img"
      :aria-label="`Line chart of ${yKey} over ${xKey}`"
    >
      <line
        v-for="t in yTicks"
        :key="`g-${t.v}`"
        :x1="PAD.left"
        :x2="W - PAD.right"
        :y1="t.y"
        :y2="t.y"
        stroke="var(--color-hairline)"
        stroke-dasharray="2 3"
      />
      <text
        v-for="t in yTicks"
        :key="`yt-${t.v}`"
        :x="PAD.left - 6"
        :y="t.y + 3"
        text-anchor="end"
        font-size="10"
        fill="var(--color-muted-foreground)"
        font-family="var(--font-mono)"
      >
        {{ fmt(t.v) }}
      </text>

      <path
        :d="linePath"
        fill="none"
        stroke="var(--color-primary)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        v-for="(d, i) in lineDots"
        :key="i"
        :cx="d.cx"
        :cy="d.cy"
        r="3"
        fill="var(--color-surface)"
        stroke="var(--color-primary)"
        stroke-width="2"
      />
      <text
        v-for="(t, i) in lineXTicks"
        :key="`xt-${i}`"
        :x="t.x"
        :y="H - 10"
        text-anchor="middle"
        font-size="10"
        fill="var(--color-muted-foreground)"
        font-family="var(--font-mono)"
      >
        {{ truncate(t.label) }}
      </text>
    </svg>

    <div v-else-if="kind === 'pie'" class="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 220 220" class="aspect-square w-full max-w-[280px] shrink-0 sm:w-72" role="img" :aria-label="`Pie chart of ${yKey} by ${xKey}`">
        <path
          v-for="(s, i) in pieSlices"
          :key="i"
          :d="s.d"
          :fill="s.color"
        />
      </svg>
      <ul class="flex flex-1 flex-col gap-1.5">
        <li
          v-for="(s, i) in pieSlices"
          :key="i"
          class="flex items-center gap-2 text-[length:var(--text-small)]"
        >
          <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: s.color }" />
          <span class="flex-1 truncate">{{ s.label }}</span>
          <span class="font-mono text-[length:var(--text-label)] uppercase tracking-[0.08em] text-[color:var(--color-muted-foreground)]">
            {{ fmt(s.value) }} · {{ s.pct.toFixed(0) }}%
          </span>
        </li>
      </ul>
    </div>
  </figure>
</template>
