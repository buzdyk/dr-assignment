import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resolveDateRange,
  ToolInputError,
} from '../../server/ai/tools/types'

describe('resolveDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-24T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to a 30-day window ending today (UTC)', () => {
    const { start_date, end_date } = resolveDateRange({})
    expect(end_date).toBe('2026-04-24')
    expect(start_date).toBe('2026-03-26')
  })

  it('honours explicit dates', () => {
    expect(
      resolveDateRange({ start_date: '2026-01-01', end_date: '2026-01-31' }),
    ).toEqual({ start_date: '2026-01-01', end_date: '2026-01-31' })
  })

  it('rejects start_date after end_date', () => {
    expect(() =>
      resolveDateRange({ start_date: '2026-02-01', end_date: '2026-01-31' }),
    ).toThrow(ToolInputError)
  })

  it('rejects malformed dates', () => {
    expect(() => resolveDateRange({ start_date: 'yesterday' })).toThrow(
      ToolInputError,
    )
  })
})
