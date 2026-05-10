import { z } from 'zod'

export const generationTypeSchema = z.enum(['image', 'video'])
export const generationStatusSchema = z.enum([
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'expired',
  'moderation_failed',
])
export const providerSchema = z.enum(['together_ai', 'fal_ai'])
export const contentRatingSchema = z.enum(['sfw', 'suggestive', 'adult'])
export const platformSchema = z.enum(['instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other'])
export const assetStatusSchema = z.enum(['generated', 'reviewed', 'approved', 'rejected', 'scheduled', 'published'])
export const campaignStatusSchema = z.enum(['draft', 'active', 'paused', 'archived'])
export const contentPlanStatusSchema = z.enum(['draft', 'approved', 'exported', 'manually_posted', 'cancelled'])
export const exportPackageStatusSchema = z.enum(['ready', 'downloaded', 'archived'])
export const moderationRatingSchema = z.enum(['safe', 'borderline', 'rejected'])
export const workspaceRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer'])

export type GenerationType = z.infer<typeof generationTypeSchema>
export type GenerationStatus = z.infer<typeof generationStatusSchema>
export type Provider = z.infer<typeof providerSchema>
export type ContentRating = z.infer<typeof contentRatingSchema>
export type Platform = z.infer<typeof platformSchema>
export type AssetStatus = z.infer<typeof assetStatusSchema>
export type CampaignStatus = z.infer<typeof campaignStatusSchema>
export type ContentPlanStatus = z.infer<typeof contentPlanStatusSchema>
export type ExportPackageStatus = z.infer<typeof exportPackageStatusSchema>
export type ModerationRating = z.infer<typeof moderationRatingSchema>
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>
