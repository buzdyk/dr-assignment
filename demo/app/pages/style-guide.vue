<script setup lang="ts">
/*
 * Living implementation of the three NexTrade brand-guide artefacts:
 *   01 Colors        — docs/artefacts/Style Guide_1.png
 *   02 Typography    — docs/artefacts/Style Guide_2.png
 *   03 UI Components — docs/artefacts/Style Guide_3.png
 *
 * Every value on this page resolves through Tailwind v4 @theme tokens declared
 * in app/assets/css/app.css. If you need to change a color, hex, or font size,
 * change it there — never here.
 */

useHead({ title: 'Style Guide · NexTrade' })

type Swatch = {
  role: string
  hex: string
  note: string
  surface: string
  textClass: string
  meta?: string
  swatchClass?: string
}

const swatches: Swatch[] = [
  {
    role: 'Primary Brand',
    hex: '#008080',
    note: 'Deep Teal. Headers, primary buttons, main navigation.',
    surface: 'bg-[color:var(--color-primary)]',
    textClass: 'text-white',
    meta: '01',
  },
  {
    role: 'Accent / AI Highlight',
    hex: '#39FF14',
    note: 'Neon Lime. Use sparingly for AI output, loading states, critical highlights.',
    surface: 'bg-[#1a1a1a]',
    textClass: 'text-white',
    swatchClass:
      'flex h-full items-center justify-center',
    meta: '02',
  },
  {
    role: 'Background · App',
    hex: '#FBF9FA',
    note: 'Off-White',
    surface: 'bg-[color:var(--color-background)]',
    textClass: 'text-[color:var(--color-foreground)]',
  },
  {
    role: 'Background · Surface',
    hex: '#FFFFFF',
    note: 'Cards, Chat',
    surface: 'bg-[color:var(--color-surface)]',
    textClass: 'text-[color:var(--color-foreground)]',
  },
  {
    role: 'Text · Primary',
    hex: '#1A1A1A',
    note: 'Almost Black',
    surface: 'bg-[color:var(--color-foreground)]',
    textClass: 'text-white',
  },
  {
    role: 'Text · Muted',
    hex: '#AC7570',
    note: 'Cool Gray',
    surface: 'bg-[color:var(--color-muted-foreground)]',
    textClass: 'text-white',
  },
]
</script>

<template>
  <main class="min-h-screen px-8 py-12">
    <div class="mx-auto flex max-w-6xl flex-col gap-16">
      <!-- ─── Header ──────────────────────────────────────────────────── -->
      <header class="flex flex-col gap-6">
        <Label>Visual Identity Guidelines</Label>
        <h1
          class="text-[length:var(--text-h1)] leading-[var(--text-h1--line-height)] font-bold tracking-[-0.05em]"
        >
          A sharp, data-centric<br />
          system for
          <span class="text-[color:var(--color-primary)]">logistics</span>
          at scale.
        </h1>
        <p
          class="max-w-2xl text-[length:var(--text-body)] leading-[var(--text-body--line-height)] text-[color:var(--color-muted-foreground)]"
        >
          This guide defines the foundational tokens and component primitives for
          NexTrade — a premium B2B logistics and vendor management platform.
          Clean edges, high contrast, and measured restraint.
        </p>
        <nav class="flex gap-6">
          <Label>01 Colors</Label>
          <Label>02 Typography</Label>
          <Label>03 Components</Label>
        </nav>
      </header>

      <!-- ─── 01 · Colors ─────────────────────────────────────────────── -->
      <section class="flex flex-col gap-6">
        <div class="flex items-end justify-between">
          <div class="flex flex-col gap-2">
            <Label>01 / 03</Label>
            <h2
              class="text-[length:var(--text-h2)] leading-[var(--text-h2--line-height)] font-bold tracking-[-0.04em]"
            >
              Colors
            </h2>
          </div>
          <Label>6 Tokens · Hex · Named</Label>
        </div>

        <!-- Row 1: Primary + Accent as hero swatches -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card v-for="swatch in swatches.slice(0, 2)" :key="swatch.role">
            <div class="relative h-40" :class="swatch.surface">
              <span
                v-if="swatch.role === 'Accent / AI Highlight'"
                aria-hidden="true"
                class="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-accent)]"
              />
              <Label
                class="absolute right-4 top-4"
                :class="swatch.textClass === 'text-white' ? '!text-white/80' : ''"
              >
                {{ swatch.role === 'Primary Brand' ? 'Primary' : 'Accent · AI' }}
              </Label>
              <span
                class="absolute bottom-4 right-4 font-mono text-[length:var(--text-label)]"
                :class="swatch.textClass === 'text-white' ? 'text-white/60' : 'text-[color:var(--color-muted-foreground)]'"
              >
                {{ swatch.meta }}
              </span>
            </div>
            <div class="flex items-start justify-between gap-4 px-5 py-4">
              <div class="flex flex-col gap-1">
                <h3
                  class="text-[length:var(--text-small)] font-semibold leading-tight"
                >
                  {{ swatch.role }}
                </h3>
                <p
                  class="text-[length:var(--text-small)] leading-[var(--text-small--line-height)] text-[color:var(--color-muted-foreground)]"
                >
                  {{ swatch.note }}
                </p>
              </div>
              <span
                class="shrink-0 font-mono text-[length:var(--text-small)] text-[color:var(--color-foreground)]"
              >
                {{ swatch.hex }}
              </span>
            </div>
          </Card>
        </div>

        <!-- Row 2: the four secondary swatches -->
        <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
          <Card v-for="swatch in swatches.slice(2)" :key="swatch.role">
            <div class="h-24" :class="swatch.surface" />
            <div class="flex flex-col gap-2 px-4 py-3">
              <div class="flex items-center justify-between gap-2">
                <h3
                  class="text-[length:var(--text-small)] font-semibold leading-tight"
                >
                  {{ swatch.role }}
                </h3>
              </div>
              <p
                class="text-[length:var(--text-small)] leading-[var(--text-small--line-height)] text-[color:var(--color-muted-foreground)]"
              >
                {{ swatch.note }}
              </p>
              <span
                class="font-mono text-[length:var(--text-small)] text-[color:var(--color-foreground)]"
              >
                {{ swatch.hex }}
              </span>
            </div>
          </Card>
        </div>
      </section>

      <!-- ─── 02 · Typography ─────────────────────────────────────────── -->
      <section class="flex flex-col gap-6">
        <div class="flex items-end justify-between">
          <div class="flex flex-col gap-2">
            <Label>02 / 03</Label>
            <h2
              class="text-[length:var(--text-h2)] leading-[var(--text-h2--line-height)] font-bold tracking-[-0.04em]"
            >
              Typography
            </h2>
          </div>
          <Label>Inter · System-UI</Label>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- Headers specimen -->
          <Card>
            <div class="flex items-center justify-between border-b border-[color:var(--color-hairline)] px-5 py-3">
              <Label>Headers</Label>
              <span class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]">
                Inter · 700 · −0.05em
              </span>
            </div>
            <div class="flex flex-col gap-5 px-5 py-5">
              <div class="flex flex-col gap-1">
                <span class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]">H1 · 60 / 0.95</span>
                <p class="text-[length:var(--text-h1)] leading-[var(--text-h1--line-height)] font-bold tracking-[-0.05em]">
                  Freight, unified.
                </p>
              </div>
              <div class="flex flex-col gap-1">
                <span class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]">H2 · 36 / 1</span>
                <p class="text-[length:var(--text-h2)] leading-[var(--text-h2--line-height)] font-bold tracking-[-0.04em]">
                  Vendor performance
                </p>
              </div>
              <div class="flex flex-col gap-1">
                <span class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]">H3 · 26 / 1.2</span>
                <p class="text-[length:var(--text-h3)] leading-[var(--text-h3--line-height)] font-bold tracking-[-0.035em]">
                  Quarterly shipment summary
                </p>
              </div>
            </div>
          </Card>

          <!-- Body specimen -->
          <Card>
            <div class="flex items-center justify-between border-b border-[color:var(--color-hairline)] px-5 py-3">
              <Label>Body</Label>
              <span class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]">
                Inter · 400 / 500
              </span>
            </div>
            <div class="flex flex-col gap-5 px-5 py-5">
              <div class="flex flex-col gap-1">
                <span class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]">Body · 15 / 1.5</span>
                <p class="text-[length:var(--text-body)] leading-[var(--text-body--line-height)]">
                  NexTrade aggregates carrier quotes, vendor SLAs, and customs
                  documentation into a single workspace. Built for operators who
                  move freight in volume.
                </p>
              </div>
              <div class="flex flex-col gap-1">
                <span class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]">Small · 13 / 1.5</span>
                <p class="text-[length:var(--text-small)] leading-[var(--text-small--line-height)] text-[color:var(--color-muted-foreground)]">
                  Last synced 4 minutes ago from 12 connected vendors. Auto-refresh every 60 seconds.
                </p>
              </div>
              <div class="flex flex-col gap-1">
                <span class="font-mono text-[length:var(--text-label)] text-[color:var(--color-muted-foreground)]">Label · 11 · Caps</span>
                <Label>Shipment · 00412-8</Label>
              </div>
            </div>
          </Card>
        </div>

        <!-- Three rules -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <div class="flex flex-col gap-2 px-5 py-4">
              <Label>Rule 01</Label>
              <p class="text-[length:var(--text-small)] leading-[var(--text-small--line-height)]">
                Headers use tight letter-spacing (−0.035em to −0.05em) for a geometric, engineered feel.
              </p>
            </div>
          </Card>
          <Card>
            <div class="flex flex-col gap-2 px-5 py-4">
              <Label>Rule 02</Label>
              <p class="text-[length:var(--text-small)] leading-[var(--text-small--line-height)]">
                Body copy stays at 400–500 weight with line-height 1.5–1.6 for sustained data reading.
              </p>
            </div>
          </Card>
          <Card>
            <div class="flex flex-col gap-2 px-5 py-4">
              <Label>Rule 03</Label>
              <p class="text-[length:var(--text-small)] leading-[var(--text-small--line-height)]">
                Metadata, IDs, and hex values use a monospaced stack for columnar alignment.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <!-- ─── 03 · Components ─────────────────────────────────────────── -->
      <section class="flex flex-col gap-6">
        <div class="flex items-end justify-between">
          <div class="flex flex-col gap-2">
            <Label>03 / 03</Label>
            <h2
              class="text-[length:var(--text-h2)] leading-[var(--text-h2--line-height)] font-bold tracking-[-0.04em]"
            >
              UI Components
            </h2>
          </div>
          <Label>Radius 4px · Shadow-SM · Hairline 1px</Label>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <!-- Card · shipment -->
          <div class="flex flex-col gap-3">
            <Label>Component · Card</Label>
            <Card>
              <div
                class="flex items-center justify-between border-b border-[color:var(--color-hairline)] px-5 py-3"
              >
                <Label>Shipment · 00412-8</Label>
                <Label>In Transit</Label>
              </div>
              <div class="flex flex-col gap-4 px-5 py-5">
                <div class="flex items-start justify-between gap-4">
                  <h3
                    class="text-[length:var(--text-h3)] leading-[var(--text-h3--line-height)] font-bold tracking-[-0.035em]"
                  >
                    Hamburg → Algeciras
                  </h3>
                  <span
                    class="font-mono text-[length:var(--text-small)] text-[color:var(--color-primary)]"
                  >
                    ETA 3d 14h
                  </span>
                </div>
                <p class="text-[length:var(--text-small)] text-[color:var(--color-muted-foreground)]">
                  MV Orinoco · 38 containers · Maersk Line
                </p>

                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <Label>Departed</Label>
                    <span class="font-mono text-[length:var(--text-small)]">62%</span>
                    <Label>Arriving</Label>
                  </div>
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-hairline)]">
                    <div class="h-full w-[62%] bg-[color:var(--color-primary)]" />
                  </div>
                </div>

                <dl class="grid grid-cols-3 gap-4 pt-2">
                  <div class="flex flex-col gap-1">
                    <Label>Distance</Label>
                    <dd class="font-mono text-[length:var(--text-body)] font-semibold">2,847 nm</dd>
                  </div>
                  <div class="flex flex-col gap-1">
                    <Label>Value</Label>
                    <dd class="font-mono text-[length:var(--text-body)] font-semibold">$1.24M</dd>
                  </div>
                  <div class="flex flex-col gap-1">
                    <Label>CO₂</Label>
                    <dd class="font-mono text-[length:var(--text-body)] font-semibold">184.2t</dd>
                  </div>
                </dl>
              </div>
              <div
                class="flex items-center justify-between border-t border-[color:var(--color-hairline)] px-5 py-3"
              >
                <Label>Last update 4 min ago</Label>
                <Button variant="primary" size="sm">View manifest →</Button>
              </div>
            </Card>

            <div class="grid grid-cols-3 gap-3">
              <Card>
                <div class="flex flex-col gap-1 px-4 py-3">
                  <Label>Radius</Label>
                  <span class="font-mono text-[length:var(--text-small)]">4px</span>
                </div>
              </Card>
              <Card>
                <div class="flex flex-col gap-1 px-4 py-3">
                  <Label>Shadow</Label>
                  <span class="font-mono text-[length:var(--text-small)]">0 8 24 / 0.08</span>
                </div>
              </Card>
              <Card>
                <div class="flex flex-col gap-1 px-4 py-3">
                  <Label>Border</Label>
                  <span class="font-mono text-[length:var(--text-small)]">1px · #E5E7EB</span>
                </div>
              </Card>
            </div>
          </div>

          <!-- Chat shell demo -->
          <div class="flex flex-col gap-3">
            <Label>Component · AI Chat</Label>
            <div class="h-[460px]">
              <ChatShell>
                <div class="flex flex-col gap-4">
                  <ChatMessage role="user">Which vendors are behind SLA this quarter?</ChatMessage>
                  <ChatMessage role="assistant">
                    <p>3 vendors are tracking below SLA this quarter:</p>
                    <ul class="mt-2 flex flex-col gap-1 font-mono text-[length:var(--text-small)]">
                      <li class="flex justify-between">
                        <span>Meridian Logistics</span><span>87.2%</span>
                      </li>
                      <li class="flex justify-between">
                        <span>Kuehne Freight Co.</span><span>91.8%</span>
                      </li>
                      <li class="flex justify-between">
                        <span>Atlas Shipping Ltd.</span><span>93.5%</span>
                      </li>
                    </ul>
                  </ChatMessage>
                </div>
                <template #input>
                  <ChatInput disabled placeholder="Ask NexTrade AI anything about shipments, vendors, or co…" />
                </template>
              </ChatShell>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <Card>
                <div class="flex flex-col gap-1 px-4 py-3">
                  <Label>Focus Ring</Label>
                  <span class="font-mono text-[length:var(--text-small)]">#008080 / 12%</span>
                </div>
              </Card>
              <Card>
                <div class="flex flex-col gap-1 px-4 py-3">
                  <Label>AI Marker</Label>
                  <span class="font-mono text-[length:var(--text-small)]">#39FF14</span>
                </div>
              </Card>
              <Card>
                <div class="flex flex-col gap-1 px-4 py-3">
                  <Label>Radius</Label>
                  <span class="font-mono text-[length:var(--text-small)]">4px</span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex flex-col gap-3">
          <Label>Component · Buttons</Label>
          <Card>
            <div class="flex flex-wrap items-center gap-4 px-5 py-5">
              <Button variant="primary">Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="ai">AI Generate</Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  </main>
</template>
