import { categoryBreakdown } from './category-breakdown'
import { orderStatusMix } from './order-status-mix'
import { revenueByRegion } from './revenue-by-region'
import { salesTrend } from './sales-trend'
import { topNProducts } from './top-n-products'
import type { ModelFacingSpec, ToolSpec } from './types'

const all: ToolSpec<any, any>[] = [
  topNProducts,
  salesTrend,
  categoryBreakdown,
  revenueByRegion,
  orderStatusMix,
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

export type {
  ChartHint,
  FilterChip,
  ModelFacingSpec,
  ToolContext,
  ToolPresentation,
  ToolSpec,
} from './types'
export { ToolInputError } from './types'
