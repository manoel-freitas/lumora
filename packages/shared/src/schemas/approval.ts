import { z } from 'zod'

export const reviewAssetSchema = z.object({ notes: z.string().optional() })
export const approveAssetSchema = z.object({ notes: z.string().optional() })
export const rejectAssetSchema = z.object({ notes: z.string().min(1).optional() })

export type ReviewAssetInput = z.infer<typeof reviewAssetSchema>
export type ApproveAssetInput = z.infer<typeof approveAssetSchema>
export type RejectAssetInput = z.infer<typeof rejectAssetSchema>
