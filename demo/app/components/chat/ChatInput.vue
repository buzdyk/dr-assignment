<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

type Props = {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Ask NexTrade AI anything about shipments, vendors, or cancellations…',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [value: string]
}>()

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

    <Label>Enter to send · Shift + Enter for newline</Label>
  </div>
</template>
