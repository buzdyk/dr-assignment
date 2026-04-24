<script setup lang="ts">
import { cva } from 'class-variance-authority'

type Variant = 'primary' | 'secondary' | 'ghost' | 'ai'
type Size = 'sm' | 'md' | 'lg'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-[var(--radius-card)]',
    'text-[length:var(--text-small)] font-medium tracking-tight',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-ring)]',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] hover:brightness-110',
        secondary:
          'bg-[color:var(--color-surface)] text-[color:var(--color-foreground)] border border-[color:var(--color-hairline)] hover:bg-[color:var(--color-background)]',
        ghost:
          'bg-transparent text-[color:var(--color-foreground)] hover:bg-[color:var(--color-background)]',
        ai:
          'bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)] font-semibold hover:brightness-95',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }))"
  >
    <span
      v-if="props.variant === 'ai'"
      aria-hidden="true"
      class="inline-block h-2 w-2 rounded-full bg-[color:var(--color-accent-foreground)]"
    />
    <slot />
  </button>
</template>
