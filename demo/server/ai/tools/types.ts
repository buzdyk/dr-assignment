import type { Kysely } from 'kysely'
import type { Database } from '~~/db/types'

export type ToolContext = {
  vendorId: string
  db: Kysely<Database>
}

export type BaseFilter = {
  start_date?: string
  end_date?: string
}

export type JsonSchema = Record<string, unknown>

export interface ToolSpec<Args = unknown, Result = unknown> {
  name: string
  description: string
  input_schema: JsonSchema
  execute: (ctx: ToolContext, args: Args) => Promise<Result>
}

export type ModelFacingSpec = Pick<
  ToolSpec,
  'name' | 'description' | 'input_schema'
>

const DAY_MS = 24 * 60 * 60 * 1000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function resolveDateRange(filter: BaseFilter): {
  start_date: string
  end_date: string
} {
  const today = new Date()
  const end = filter.end_date ?? today.toISOString().slice(0, 10)
  const endMs = parseDate(end).getTime()
  const start =
    filter.start_date ?? new Date(endMs - 29 * DAY_MS).toISOString().slice(0, 10)
  if (parseDate(start).getTime() > endMs) {
    throw new ToolInputError('start_date must be on or before end_date')
  }
  return { start_date: start, end_date: end }
}

export function parseDate(value: string): Date {
  if (!ISO_DATE.test(value)) {
    throw new ToolInputError(`invalid date "${value}" — expected YYYY-MM-DD`)
  }
  const d = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) {
    throw new ToolInputError(`invalid date "${value}"`)
  }
  return d
}

export class ToolInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ToolInputError'
  }
}

export const baseFilterSchema = {
  start_date: {
    type: 'string',
    format: 'date',
    description: 'Inclusive start date, YYYY-MM-DD. Defaults to 30 days before end_date.',
  },
  end_date: {
    type: 'string',
    format: 'date',
    description: 'Inclusive end date, YYYY-MM-DD. Defaults to today.',
  },
} as const
