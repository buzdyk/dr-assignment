import { createExecutor } from '../ai/executor'
import { resolveProvider, ProviderError } from '../ai/providers'
import { createRobotProvider } from '../ai/providers/robot'
import { runChat, type ChatEvent } from '../ai/runner'
import { buildSystemPrompt } from '../ai/system-prompt'
import { toolSpecs } from '../ai/tools'
import { useDb } from '../utils/db'

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    prompt?: unknown
    vendor_id?: unknown
    debug?: unknown
  }>(event)

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

  let provider
  try {
    provider = body.debug === true ? createRobotProvider() : resolveProvider()
  } catch (err) {
    if (err instanceof ProviderError) {
      throw createError({
        statusCode: 502,
        data: { error: 'provider_error', message: err.message },
      })
    }
    throw err
  }

  const executor = createExecutor({ vendorId: vendor.id, db })
  const stream = createEventStream(event)

  const emit = (e: ChatEvent) =>
    stream.push({ event: e.type, data: JSON.stringify(e) })

  const toolLatencyMs =
    body.debug === true
      ? Number(process.env.ROBOT_TOOL_LATENCY_MS ?? 500)
      : 0

  runChat({
    provider,
    system: buildSystemPrompt(vendor),
    messages: [{ role: 'user', content: body.prompt }],
    tools: toolSpecs(),
    dispatch: executor.dispatch,
    emit,
    toolLatencyMs,
  }).finally(() => {
    stream.close()
  })

  return stream.send()
})
