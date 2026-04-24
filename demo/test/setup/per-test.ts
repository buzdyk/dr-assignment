import { afterAll } from 'vitest'
import { closeSharedTestPool } from '../helpers/db'

afterAll(async () => {
  await closeSharedTestPool()
})
