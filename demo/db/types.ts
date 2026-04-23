import type { ColumnType, Generated } from 'kysely'

type Timestamp = ColumnType<Date, Date | string, Date | string>
type Decimal = ColumnType<string, string | number, string | number>

export interface VendorsTable {
  id: Generated<string>
  company_name: string
  contact_email: string
  status: string
  created_at: Generated<Timestamp>
}

export interface CustomersTable {
  id: Generated<string>
  email: string
  region: string
  signup_date: Timestamp
}

export interface ProductsTable {
  id: Generated<string>
  vendor_id: string
  sku: string
  name: string
  category: string
  unit_price: Decimal
  created_at: Generated<Timestamp>
}

export interface OrdersTable {
  id: Generated<string>
  customer_id: string
  order_date: Timestamp
  status: string
  total_amount: Decimal
  shipped_at: Timestamp | null
  delivered_at: Timestamp | null
}

export interface OrderItemsTable {
  id: Generated<string>
  order_id: string
  product_id: string
  quantity: number
  unit_price: Decimal
}

export interface OrderCancellationsTable {
  id: Generated<string>
  order_id: string
  reason_category: string | null
  detailed_reason: string | null
  cancelled_at: Timestamp
}

export interface Database {
  vendors: VendorsTable
  customers: CustomersTable
  products: ProductsTable
  orders: OrdersTable
  order_items: OrderItemsTable
  order_cancellations: OrderCancellationsTable
}
