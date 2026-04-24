<script setup lang="ts">
/*
 * Chat container: header (title + lime assistant dot + optional actions slot),
 * message stream, and sticky input. Matches the AI Chat card from Style Guide_3.
 */

import { useTemplateRef } from 'vue'

type Props = {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'NexTrade AI',
})

const scrollEl = useTemplateRef<HTMLElement>('scrollEl')
defineExpose({ scrollEl })
</script>

<template>
  <Card class="flex h-full w-full flex-col overflow-hidden">
    <header
      class="flex items-center justify-between gap-4 border-b border-[color:var(--color-hairline)] px-5 py-3"
    >
      <div class="flex items-center gap-3">
        <h2
          v-if="title"
          class="text-[length:var(--text-h3)] font-bold leading-none tracking-[-0.035em]"
        >
          {{ title }}
        </h2>
      </div>
      <slot name="header-actions" />
    </header>

    <div ref="scrollEl" class="flex-1 overflow-y-auto px-5 py-5">
      <slot />
    </div>

    <footer class="border-t border-[color:var(--color-hairline)] px-5 py-4">
      <slot name="input" />
    </footer>
  </Card>
</template>
