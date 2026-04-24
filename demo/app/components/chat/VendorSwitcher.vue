<script setup lang="ts">
/*
 * Toggle between seeded tenants. Selection is the identity the chat endpoint
 * scopes tool calls to — Alex's "data isolation proof" from the kickoff.
 */

type Vendor = { id: string; label: string }

type Props = {
  vendors: Vendor[]
  modelValue: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex items-center gap-3">
    <Label>Viewing as</Label>
    <div
      role="radiogroup"
      aria-label="Vendor"
      class="inline-flex rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] p-1"
    >
      <button
        v-for="vendor in vendors"
        :key="vendor.id"
        type="button"
        role="radio"
        :aria-checked="modelValue === vendor.id"
        :class="cn(
          'rounded-[calc(var(--radius-card)-2px)] px-3 py-1.5 text-[length:var(--text-small)] font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)]',
          modelValue === vendor.id
            ? 'bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]'
            : 'text-[color:var(--color-foreground)] hover:bg-[color:var(--color-background)]',
        )"
        @click="$emit('update:modelValue', vendor.id)"
      >
        {{ vendor.label }}
      </button>
    </div>
  </div>
</template>
