<script setup lang="ts">
useHead({ title: 'NexTrade' })
</script>

<template>
  <main class="min-h-screen px-8 py-16">
    <div class="mx-auto max-w-3xl">
      <Label>Index · 00</Label>
      <h1 class="mt-4 text-[length:var(--text-h1)] leading-[var(--text-h1--line-height)] font-bold tracking-[-0.05em]">
        NexTrade
      </h1>
      <p class="mt-4 text-[length:var(--text-body)] leading-[var(--text-body--line-height)] text-[color:var(--color-muted-foreground)]">
        Chat UI and style guide are wired up. Start from the style guide while the chat surface comes together.
      </p>

      <div class="mt-8 flex gap-3">
        <NuxtLink to="/chat">
          <Button variant="primary">Open chat</Button>
        </NuxtLink>
        <NuxtLink to="/style-guide">
          <Button variant="secondary">Open style guide</Button>
        </NuxtLink>
        <NuxtLink to="/debug">
          <Button variant="ghost">Tool playground</Button>
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
