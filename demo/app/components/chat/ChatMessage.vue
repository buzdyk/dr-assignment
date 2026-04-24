<script setup lang="ts">
type Props = {
  role: 'user' | 'assistant'
}

defineProps<Props>()
</script>

<template>
  <div :class="cn('flex w-full', role === 'user' ? 'justify-end' : 'justify-start')">
    <div
      v-if="role === 'user'"
      class="max-w-[80%] rounded-[var(--radius-card)] bg-[color:var(--color-foreground)] px-4 py-3 text-[length:var(--text-body)] leading-[var(--text-body--line-height)] text-white"
    >
      <slot />
    </div>

    <article
      v-else
      class="max-w-[80%] rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-4 py-3 text-[length:var(--text-body)] leading-[var(--text-body--line-height)]"
    >
      <slot />
    </article>
  </div>
</template>
