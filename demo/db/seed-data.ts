export const SUPPLIER_1_ID = '11111111-1111-4111-a111-111111111111'
export const SUPPLIER_2_ID = '22222222-2222-4222-a222-222222222222'

export const VENDORS = [
  {
    id: SUPPLIER_1_ID,
    company_name: 'Supplier 1',
    contact_email: 'ops@supplier1.example',
    status: 'active',
  },
  {
    id: SUPPLIER_2_ID,
    company_name: 'Supplier 2',
    contact_email: 'ops@supplier2.example',
    status: 'active',
  },
] as const

export const CATEGORIES = ['Widgets', 'Gadgets', 'Gizmos', 'Thingamajigs'] as const
export const COLOURS = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Black',
  'White',
  'Purple',
  'Orange',
] as const

export const SEED_DAYS = 45
export const ORDERS_PER_DAY_MIN = 5
export const ORDERS_PER_DAY_MAX = 15
export const CANCELLATION_RATE = 0.1
export const FAKER_SEED = 123
