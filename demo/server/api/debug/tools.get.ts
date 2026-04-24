import { toolSpecs } from '../../ai/tools'

export default defineEventHandler(() => {
  return { tools: toolSpecs() }
})
