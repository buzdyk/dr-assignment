---
type: todo
status: done
description: Seed two demo vendors with product/order/cancellation data rich enough for the kickoff's demo queries
---
# DB Seeds

## Problem

The chat UI demo needs deterministic seed data — realistic enough to answer the vendor-style queries from the kickoff, varied enough to demonstrate tenant isolation, and reproducible across machines.

## What the artefacts tell us

From [[../../artefacts/kickoff_audio_sync]]:

- **Two suppliers minimum.** Alex: "mock up two different suppliers — Supplier 1 and Supplier 2 — and we can use a little dropdown to switch between them to prove the data isolation actually works."
- **Time range coverage.** Kevin's example queries reference "last thirty days," "last month," and day-over-day comparisons (Tuesday vs Wednesday) — so seed ≥30 days of order history.
- **Top-N variety.** "Top three worst-performing items this month" / "top five items last month" means each vendor needs enough distinct products for top-N to be meaningful (≥10 products per vendor).
- **Day-granular sales.** "How many red widgets did I sell on Tuesday compared to Wednesday?" implies enough orders per day to produce non-trivial aggregates.
- **Category breakdowns.** Pie-chart categories need ≥3-4 categories across each vendor's catalog.
- **Cancellations without reasons.** Dave: "Our records show what day an item was bought, the price, and whether the order was canceled. But we do not record *why*." So `order_cancellations` rows should exist, but `reason_category` / `detailed_reason` stay NULL (or very sparse) to match reality and exercise the AI's "I don't know" behaviour.

## Scope for MVP

- **2 vendors** — `Supplier 1`, `Supplier 2`, with stable UUIDs so the frontend switcher can hard-code them
- **~10-15 products per vendor** across 3-4 categories
- **~15-30 customers** (shared pool, since orders reference customers not vendors)
- **30-60 days of order history**, roughly 5-20 orders per day spread across vendors
- **~10% of orders cancelled**, with `reason_category` / `detailed_reason` left NULL

## Approach

- Seed files under `db/seeds/`, one per logical dataset (`seed-vendors.ts`, `seed-products.ts`, `seed-customers.ts`, `seed-orders.ts`, `seed-cancellations.ts`)
- Typed with `Insertable<DB['<table>']>` — Kysely catches column mistakes at compile time
- `@faker-js/faker` with a pinned seed (`faker.seed(123)`) for determinism
- Run via kysely-ctl's seed runner, wired to `npm run db:seed`
- Idempotent — truncate in dev, or use `on conflict do nothing`
