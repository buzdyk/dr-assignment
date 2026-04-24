<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { useTemplateRef } from 'vue'

type Props = {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  debug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Ask NexTrade AI anything about shipments, vendors, or cancellations…',
  disabled: false,
  debug: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:debug': [value: boolean]
  submit: [value: string]
}>()

function onDebugToggle(e: Event) {
  emit('update:debug', (e.target as HTMLInputElement).checked)
}

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    const trimmed = props.modelValue.trim()
    if (trimmed.length > 0) emit('submit', trimmed)
  }
}

function onSend() {
  const trimmed = props.modelValue.trim()
  if (trimmed.length > 0) emit('submit', trimmed)
}

const helpDialog = useTemplateRef<HTMLDialogElement>('helpDialog')

function openHelp() {
  helpDialog.value?.showModal()
}
function closeHelp() {
  helpDialog.value?.close()
}
function onDialogClick(e: MouseEvent) {
  if (e.target === helpDialog.value) helpDialog.value?.close()
}

const ROBOT_PROMPTS = [
  { example: '"top 5 products"', triggers: 'bar — top N products by revenue' },
  { example: '"sales trend over time"', triggers: 'line — daily revenue (also: "last 30 days", "last month")' },
  { example: '"revenue by category"', triggers: 'pie — category breakdown' },
  { example: '"revenue by region"', triggers: 'bar — by customer region' },
  { example: '"status mix"', triggers: 'pie — order status (also: "cancellation rate")' },
  { example: '"why are orders cancelled?"', triggers: 'refusal — reasons aren’t captured' },
  { example: '"forecast next quarter"', triggers: 'refusal — no forecasting tool' },
]
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="flex items-end gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2 focus-within:ring-4 focus-within:ring-[color:var(--color-ring)]"
    >
      <textarea
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        rows="1"
        class="flex-1 resize-none bg-transparent py-1 text-[length:var(--text-body)] leading-[var(--text-body--line-height)] outline-none placeholder:text-[color:var(--color-muted-foreground)]"
        @input="onInput"
        @keydown="onKeydown"
      />
      <Button
        variant="primary"
        size="sm"
        :disabled="disabled || modelValue.trim().length === 0"
        aria-label="Send message"
        @click="onSend"
      >
        <ArrowRight :size="16" :stroke-width="2" />
      </Button>
    </div>

    <div class="flex items-center justify-between gap-3">
      <Label>Enter to send · Shift + Enter for newline</Label>
      <div class="flex items-center gap-2">
        <label class="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            :checked="debug"
            :disabled="disabled"
            class="h-3.5 w-3.5 accent-[color:var(--color-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)]"
            @change="onDebugToggle"
          />
          <Label>debug</Label>
        </label>
        <button
          type="button"
          aria-label="Show example prompts"
          class="grid h-5 w-5 place-items-center rounded-full border border-[color:var(--color-hairline)] font-mono text-[length:var(--text-label)] leading-none text-[color:var(--color-muted-foreground)] transition-colors hover:bg-[color:var(--color-background)] hover:text-[color:var(--color-foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)]"
          @click="openHelp"
        >
          ?
        </button>
      </div>
    </div>

    <dialog
      ref="helpDialog"
      class="m-auto w-[min(92vw,560px)] rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] p-0 shadow-[var(--shadow-card)] backdrop:bg-black/40"
      @click="onDialogClick"
    >
      <div class="flex flex-col gap-4 p-5">
        <header class="flex items-start justify-between gap-4">
          <div class="flex flex-col gap-1">
            <Label>example prompts</Label>
            <h3 class="text-[length:var(--text-h3)] font-bold leading-none tracking-[-0.035em]">
              Try one of these
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            class="grid h-7 w-7 place-items-center rounded-[var(--radius-card)] text-[color:var(--color-muted-foreground)] transition-colors hover:bg-[color:var(--color-background)] hover:text-[color:var(--color-foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)]"
            @click="closeHelp"
          >
            ×
          </button>
        </header>

        <p class="text-[length:var(--text-small)] text-[color:var(--color-muted-foreground)]">
          The dev provider routes by regex on your last message. These are the patterns it recognises.
        </p>

        <ul class="flex flex-col gap-2">
          <li
            v-for="p in ROBOT_PROMPTS"
            :key="p.example"
            class="flex flex-col gap-0.5 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-background)] px-3 py-2"
          >
            <span class="font-mono text-[length:var(--text-small)] text-[color:var(--color-foreground)]">
              {{ p.example }}
            </span>
            <span class="text-[length:var(--text-small)] text-[color:var(--color-muted-foreground)]">
              {{ p.triggers }}
            </span>
          </li>
        </ul>

        <p class="text-[length:var(--text-label)] uppercase tracking-[0.08em] font-mono text-[color:var(--color-muted-foreground)]">
          Heads up: tool args are hardcoded (e.g. always top 3 by revenue). Bare letters “na” / “eu” anywhere will route to revenue-by-region.
        </p>
      </div>
    </dialog>
  </div>
</template>
