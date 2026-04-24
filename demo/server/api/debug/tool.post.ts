/*
 * Dev-only playground endpoint. Calls a single tool by name with arbitrary args
 * and returns the raw result. No auth, no rate limiting — not production-safe.
 */

import { toolRegistry, ToolInputError } from '../../ai/tools'
import { useDb } from '../../utils/db'

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: unknown
    args?: unknown
    vendor_id?: unknown
  }>(event)

  if (typeof body?.name !== 'string' || !body.name) {
    throw createError({
      statusCode: 400,
      data: { error: 'invalid_request', message: 'name is required' },
    })
  }
  if (typeof body?.vendor_id !== 'string' || !UUID.test(body.vendor_id)) {
    throw createError({
      statusCode: 400,
      data: { error: 'invalid_request', message: 'vendor_id must be a UUID' },
    })
  }

  const tool = toolRegistry[body.name]
  if (!tool) {
    throw createError({
      statusCode: 400,
      data: {
        error: 'unknown_tool',
        message: `No tool named "${body.name}"`,
      },
    })
  }

  const db = useDb()
  const vendor = await db
    .selectFrom('vendors')
    .select(['id'])
    .where('id', '=', body.vendor_id)
    .executeTakeFirst()

  if (!vendor) {
    throw createError({
      statusCode: 404,
      data: { error: 'invalid_request', message: 'vendor not found' },
    })
  }

  const args = (body.args ?? {}) as Record<string, unknown>

  const startedAt = Date.now()
  try {
    const result = await tool.execute({ vendorId: vendor.id, db }, args as never)
    return { result, elapsed_ms: Date.now() - startedAt }
  } catch (err) {
    if (err instanceof ToolInputError) {
      throw createError({
        statusCode: 400,
        data: { error: 'invalid_params', message: err.message },
      })
    }
    throw createError({
      statusCode: 500,
      data: {
        error: 'tool_error',
        message: err instanceof Error ? err.message : String(err),
      },
    })
  }
})
