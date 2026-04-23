---
type: todo
status: pending
description: Wire the NexTrade schema into Kysely migrations via @kysely/kysely-ctl
---
# DB Migrations

## Problem

The NexTrade database schema needs to be set up via Kysely migrations scaffolded by `@kysely/kysely-ctl`. Schema is fixed and specified in `docs/artefacts/Database schema.png`.

## Source of truth

`docs/artefacts/Database schema.png` — six tables:

- **vendors** — `id uuid PK`, `company_name`, `contact_email`, `status`, `created_at`
- **products** — `id uuid PK`, `vendor_id uuid FK → vendors`, `sku`, `name`, `category`, `unit_price`, `created_at`
- **customers** — `id uuid PK`, `email`, `region`, `signup_date`
- **orders** — `id uuid PK`, `customer_id uuid FK → customers`, `order_date`, `status`, `total_amount`, `shipped_at`, `delivered_at`
- **order_items** — `id uuid PK`, `order_id uuid FK → orders`, `product_id uuid FK → products`, `quantity`, `unit_price`
- **order_cancellations** — `id uuid PK`, `order_id uuid FK → orders` (UNIQUE), `reason_category`, `detailed_reason`, `cancelled_at`

## Approach

- `npx kysely-ctl init` to scaffold the `db/migrations/` folder
- One migration per table, or one combined initial migration — either is fine at this stage
- Indexes worth adding up front: `products.vendor_id`, `orders.customer_id`, `orders.order_date`, `order_items.order_id`, `order_items.product_id`
- Mirror every migration in the hand-maintained `Database` TS interface (`db/types.ts`) that Kysely consumes
- Document the `kysely-ctl migrate` invocation in the project README

## Related

- [[../../adr/005-DB_TOOLING]]
- [[../../adr/004-DOCKER_COMPOSE]]
- [[DB_SEEDS]]
