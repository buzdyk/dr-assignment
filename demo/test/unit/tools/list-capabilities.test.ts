import { describe, expect, it } from 'vitest'
import { listCapabilities } from '../../../server/ai/tools/list-capabilities'

// Pinned so the test fails loudly when a tool is added, renamed, or
// accidentally dropped — rather than mirroring the implementation's own filter.
const EXPECTED_TOOL_NAMES = [
  'get_top_n_products',
  'get_sales_trend',
  'get_category_breakdown',
  'get_revenue_by_region',
  'get_order_status_mix',
] as const

describe('list_capabilities', () => {
  it('advertises every data tool and never itself', async () => {
    const result = await listCapabilities.execute(
      // The handler does not touch ctx — pass a typed nothing.
      {} as never,
      {} as never,
    )
    const names = result.rows.map((r) => r.name).sort()
    expect(names).toEqual([...EXPECTED_TOOL_NAMES].sort())
    for (const row of result.rows) {
      expect(typeof row.description).toBe('string')
      expect(row.description.length).toBeGreaterThan(0)
    }
  })

  it('keeps the overview count in sync with the row count', async () => {
    const result = await listCapabilities.execute({} as never, {} as never)
    expect(result.overview).toContain(String(result.rows.length))
    expect(result.overview).toMatch(/tools? available/)
  })

  it('exposes an empty input schema (no arguments)', () => {
    const schema = listCapabilities.input_schema as {
      type: string
      properties: Record<string, unknown>
    }
    expect(schema.type).toBe('object')
    expect(Object.keys(schema.properties)).toEqual([])
  })
})
