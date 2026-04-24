import { describe, expect, it } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'
import { SUPPLIER_1_ID } from '../../db/seed-data'

await setup({
  rootDir: process.cwd(),
  server: true,
  dev: false,
  setupTimeout: 240_000,
})

describe('GET /api/debug/tools', () => {
  it('returns the model-facing tool specs', async () => {
    const body = await $fetch<{
      tools: Array<{ name: string; description: string; input_schema: unknown }>
    }>('/api/debug/tools')
    expect(Array.isArray(body.tools)).toBe(true)
    expect(body.tools.length).toBeGreaterThan(0)
    const names = body.tools.map((t) => t.name)
    expect(names).toContain('get_top_n_products')
    expect(names).toContain('list_capabilities')
    for (const t of body.tools) {
      expect(typeof t.name).toBe('string')
      expect(typeof t.description).toBe('string')
      expect(typeof t.input_schema).toBe('object')
    }
  })
})

async function postDebugTool(body: unknown) {
  const res = await fetch('/api/debug/tool', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res
}

describe('POST /api/debug/tool', () => {
  it('dispatches a tool by name and returns the envelope', async () => {
    const res = await postDebugTool({
      name: 'get_top_n_products',
      vendor_id: SUPPLIER_1_ID,
      args: { n: 3, metric: 'revenue' },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      result: { rows: unknown[]; overview: string }
      elapsed_ms: number
    }
    expect(Array.isArray(body.result.rows)).toBe(true)
    expect(body.result.rows.length).toBeLessThanOrEqual(3)
    expect(typeof body.elapsed_ms).toBe('number')
  })

  it('returns 400 for an unknown tool name', async () => {
    const res = await postDebugTool({
      name: 'no_such_tool',
      vendor_id: SUPPLIER_1_ID,
      args: {},
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { data: { error: string } }
    expect(body.data.error).toBe('unknown_tool')
  })

  it('returns 400 for invalid tool params via ToolInputError', async () => {
    const res = await postDebugTool({
      name: 'get_top_n_products',
      vendor_id: SUPPLIER_1_ID,
      args: { n: 0, metric: 'revenue' },
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { data: { error: string } }
    expect(body.data.error).toBe('invalid_params')
  })

  it('rejects missing tool name', async () => {
    const res = await postDebugTool({
      vendor_id: SUPPLIER_1_ID,
      args: {},
    })
    expect(res.status).toBe(400)
  })
})
