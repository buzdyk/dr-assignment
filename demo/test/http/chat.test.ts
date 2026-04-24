import { describe, expect, it } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { SUPPLIER_1_ID } from '../../db/seed-data'

await setup({
  rootDir: process.cwd(),
  server: true,
  dev: false,
  setupTimeout: 240_000,
})

type SseEvent = { event: string; data: string }

async function readSse(response: Response): Promise<SseEvent[]> {
  if (!response.body) throw new Error('no response body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const events: SseEvent[] = []
  while (true) {
    const { value, done } = await reader.read()
    if (value) buffer += decoder.decode(value, { stream: true })
    let idx = buffer.indexOf('\n\n')
    while (idx !== -1) {
      const block = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const ev = parseSseBlock(block)
      if (ev) events.push(ev)
      idx = buffer.indexOf('\n\n')
    }
    if (done) break
  }
  return events
}

function parseSseBlock(block: string): SseEvent | null {
  const lines = block.split(/\r?\n/)
  let event = ''
  const dataParts: string[] = []
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataParts.push(line.slice(5).trimStart())
  }
  if (!event && dataParts.length === 0) return null
  return { event, data: dataParts.join('\n') }
}

async function postChat(body: unknown): Promise<Response> {
  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/chat', () => {
  it('streams tool_start → tool_result → text(s) → done for a tool prompt', async () => {
    const res = await postChat({
      prompt: 'show me the top 3 products',
      vendor_id: SUPPLIER_1_ID,
      debug: true,
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type') ?? '').toContain('text/event-stream')

    const events = await readSse(res)
    const types = events.map((e) => e.event)
    // Assert relative ordering rather than strict indices so any future
    // top-of-stream event (connected/ping) doesn't silently break this.
    const firstToolStart = types.indexOf('tool_start')
    const firstToolResult = types.indexOf('tool_result')
    const firstText = types.indexOf('text')
    const lastDone = types.lastIndexOf('done')
    expect(firstToolStart).toBeGreaterThanOrEqual(0)
    expect(firstToolResult).toBeGreaterThan(firstToolStart)
    expect(firstText).toBeGreaterThan(firstToolResult)
    expect(lastDone).toBe(types.length - 1)
    // Every payload is valid JSON.
    for (const e of events) {
      expect(() => JSON.parse(e.data)).not.toThrow()
    }
    // Robot's top-3-products template produces this header; asserting it
    // catches regressions where the stream shape is right but content is wrong.
    const textPayload = events
      .filter((e) => e.event === 'text')
      .map((e) => (JSON.parse(e.data) as { text: string }).text)
      .join('')
    expect(textPayload).toContain('Top products by revenue')
  })

  it('streams text → done for a text-only refusal prompt', async () => {
    const res = await postChat({
      prompt: 'forecast next quarter',
      vendor_id: SUPPLIER_1_ID,
      debug: true,
    })
    const events = await readSse(res)
    const types = events.map((e) => e.event)
    expect(types.every((t) => t === 'text' || t === 'done')).toBe(true)
    expect(types.at(-1)).toBe('done')
    // None of the text events should be tool_start/tool_result.
    expect(types.includes('tool_start')).toBe(false)
  })

  it('rejects missing prompt', async () => {
    const res = await postChat({ vendor_id: SUPPLIER_1_ID, debug: true })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { data: { error: string; message: string } }
    expect(body.data.error).toBe('invalid_request')
    expect(body.data.message).toMatch(/prompt/i)
  })

  it('rejects non-UUID vendor_id', async () => {
    const res = await postChat({
      prompt: 'hi',
      vendor_id: 'not-a-uuid',
      debug: true,
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { data: { error: string; message: string } }
    expect(body.data.error).toBe('invalid_request')
    expect(body.data.message).toMatch(/vendor_id/i)
  })

  it('returns 404 for an unknown vendor', async () => {
    const res = await postChat({
      prompt: 'hi',
      vendor_id: '00000000-0000-4000-a000-000000000000',
      debug: true,
    })
    expect(res.status).toBe(404)
    const body = (await res.json()) as { data: { error: string; message: string } }
    expect(body.data.message).toMatch(/vendor/i)
  })
})
