import { createExecutor } from '../ai/executor'
import { resolveProvider, ProviderError } from '../ai/providers'
import { buildSystemPrompt } from '../ai/system-prompt'
import { toolSpecs } from '../ai/tools'
import { useDb } from '../utils/db'

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const body = await readBody<{ prompt?: unknown; vendor_id?: unknown }>(event)

  if (typeof body?.prompt !== 'string' || !body.prompt.trim()) {
    throw createError({
      statusCode: 400,
      data: { error: 'invalid_request', message: 'prompt is required' },
    })
  }
  if (typeof body?.vendor_id !== 'string' || !UUID.test(body.vendor_id)) {
    throw createError({
      statusCode: 400,
      data: {
        error: 'invalid_request',
        message: 'vendor_id must be a UUID',
      },
    })
  }

  const db = useDb()
  const vendor = await db
    .selectFrom('vendors')
    .select(['id', 'company_name'])
    .where('id', '=', body.vendor_id)
    .executeTakeFirst()

  if (!vendor) {
    throw createError({
      statusCode: 404,
      data: { error: 'invalid_request', message: 'vendor not found' },
    })
  }

  const executor = createExecutor({ vendorId: vendor.id, db })
  const provider = resolveProvider()

  try {
    const { text } = await provider.runConversation({
      system: buildSystemPrompt(vendor),
      tools: toolSpecs(),
      messages: [{ role: 'user', content: body.prompt }],
      onToolCall: executor.dispatch,
    })

    return {
      text,
      tool_calls: executor.calls.map((c) => ({
        name: c.name,
        args: c.args,
        result: c.result,
        ...(c.is_error ? { is_error: true } : {}),
      })),
    }
  } catch (err) {
    if (err instanceof ProviderError) {
      throw createError({
        statusCode: 502,
        data: { error: 'provider_error', message: err.message },
      })
    }
    throw createError({
      statusCode: 500,
      data: {
        error: 'internal_error',
        message: err instanceof Error ? err.message : String(err),
      },
    })
  }
})
