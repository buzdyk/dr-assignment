<script setup lang="ts">
/*
 * Uppercase, tracked meta label — "COMPONENT · CARD", "SHIPMENT · 00412-8".
 * Kept in the ui/ folder so chat and page shells can use it without duplicating spec.
 */
</script>

<template>
  <span
    class="font-mono text-[length:var(--text-label)] tracking-[0.08em] uppercase text-[color:var(--color-muted-foreground)]"
  >
    <slot />
  </span>
</template>
