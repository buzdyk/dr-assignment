<script setup lang="ts">
/*
 * Chat container: header (title + lime assistant dot + optional slot for vendor switcher),
 * message stream, and sticky input. Matches the AI Chat card from Style Guide_3.
 */

type Props = {
  title?: string
  status?: string
}

withDefaults(defineProps<Props>(), {
  title: 'NexTrade AI',
  status: 'AI READY',
})
</script>

<template>
  <Card class="flex h-full w-full flex-col overflow-hidden">
    <header
      class="flex items-center justify-between gap-4 border-b border-[color:var(--color-hairline)] px-5 py-3"
    >
      <div class="flex items-center gap-3">
        <span
          aria-hidden="true"
          class="inline-block h-2 w-2 rounded-full bg-[color:var(--color-accent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_25%,transparent)]"
        />
        <h2
          v-if="title"
          class="text-[length:var(--text-h3)] font-bold leading-none tracking-[-0.035em]"
        >
          {{ title }}
        </h2>
      </div>
      <Label>{{ status }}</Label>
    </header>

    <div class="flex-1 overflow-y-auto px-5 py-5">
      <slot />
    </div>

    <footer class="border-t border-[color:var(--color-hairline)] px-5 py-4">
      <slot name="input" />
    </footer>
  </Card>
</template>
