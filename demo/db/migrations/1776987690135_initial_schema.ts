import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('vendors')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('company_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('contact_email', 'varchar(255)', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable('customers')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('region', 'varchar(64)', (col) => col.notNull())
    .addColumn('signup_date', 'timestamptz', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('products')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('vendor_id', 'uuid', (col) =>
      col.notNull().references('vendors.id').onDelete('restrict'),
    )
    .addColumn('sku', 'varchar(64)', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('category', 'varchar(64)', (col) => col.notNull())
    .addColumn('unit_price', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable('orders')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('customer_id', 'uuid', (col) =>
      col.notNull().references('customers.id').onDelete('restrict'),
    )
    .addColumn('order_date', 'timestamptz', (col) => col.notNull())
    .addColumn('status', 'varchar(32)', (col) => col.notNull())
    .addColumn('total_amount', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('shipped_at', 'timestamptz')
    .addColumn('delivered_at', 'timestamptz')
    .execute()

  await db.schema
    .createTable('order_items')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('order_id', 'uuid', (col) =>
      col.notNull().references('orders.id').onDelete('cascade'),
    )
    .addColumn('product_id', 'uuid', (col) =>
      col.notNull().references('products.id').onDelete('restrict'),
    )
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('unit_price', 'decimal(12, 2)', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('order_cancellations')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('order_id', 'uuid', (col) =>
      col
        .notNull()
        .unique()
        .references('orders.id')
        .onDelete('cascade'),
    )
    .addColumn('reason_category', 'varchar(64)')
    .addColumn('detailed_reason', 'text')
    .addColumn('cancelled_at', 'timestamptz', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('products_vendor_id_idx')
    .on('products')
    .column('vendor_id')
    .execute()

  await db.schema
    .createIndex('orders_customer_id_idx')
    .on('orders')
    .column('customer_id')
    .execute()

  await db.schema
    .createIndex('orders_order_date_idx')
    .on('orders')
    .column('order_date')
    .execute()

  await db.schema
    .createIndex('order_items_order_id_idx')
    .on('order_items')
    .column('order_id')
    .execute()

  await db.schema
    .createIndex('order_items_product_id_idx')
    .on('order_items')
    .column('product_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('order_cancellations').ifExists().execute()
  await db.schema.dropTable('order_items').ifExists().execute()
  await db.schema.dropTable('orders').ifExists().execute()
  await db.schema.dropTable('products').ifExists().execute()
  await db.schema.dropTable('customers').ifExists().execute()
  await db.schema.dropTable('vendors').ifExists().execute()
}
