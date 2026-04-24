<script setup lang="ts">
type Props = {
  as?: string
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  interactive: false,
})
</script>

<template>
  <component
    :is="props.as"
    :class="cn(
      'bg-[color:var(--color-surface)]',
      'border border-[color:var(--color-hairline)]',
      'rounded-[var(--radius-card)]',
      'shadow-[var(--shadow-card)]',
      props.interactive && 'transition-shadow hover:shadow-lg',
    )"
  >
    <slot />
  </component>
</template>
