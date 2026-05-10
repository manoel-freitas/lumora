import { db } from '../../infra/db'
import { generationCosts } from '../../db/schema'

export async function recordGenerationCost(input: {
  workspaceId: string
  generationId: string
  provider: 'together_ai' | 'fal_ai'
  model: string
  estimatedCostUsd?: string
}) {
  const [cost] = await db.insert(generationCosts).values({
    workspaceId: input.workspaceId,
    generationId: input.generationId,
    provider: input.provider,
    model: input.model,
    estimatedCostUsd: input.estimatedCostUsd,
  }).returning()

  return cost
}
