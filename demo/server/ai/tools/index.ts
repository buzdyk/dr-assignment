import { cancellationRate } from './cancellation-rate'
import { categoryBreakdown } from './category-breakdown'
import { compareDays } from './compare-days'
import { salesTrend } from './sales-trend'
import { topNProducts } from './top-n-products'
import type { ModelFacingSpec, ToolSpec } from './types'

const all: ToolSpec<any, any>[] = [
  topNProducts,
  salesTrend,
  categoryBreakdown,
  compareDays,
  cancellationRate,
]

export const toolRegistry: Record<string, ToolSpec<any, any>> = Object.fromEntries(
  all.map((t) => [t.name, t]),
)

export function toolSpecs(): ModelFacingSpec[] {
  return all.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }))
}

export type { ToolContext, ToolSpec, ModelFacingSpec } from './types'
export { ToolInputError } from './types'
