import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  decimal,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const generationTypeEnum = pgEnum('generation_type', ['image', 'video'])
export const generationStatusEnum = pgEnum('generation_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'expired',
  'moderation_failed',
])

export const providerEnum = pgEnum('provider', ['together_ai', 'fal_ai'])
export const contentRatingEnum = pgEnum('content_rating', ['sfw', 'suggestive', 'adult'])
export const platformEnum = pgEnum('platform', ['instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other'])
export const assetStatusEnum = pgEnum('asset_status', ['generated', 'reviewed', 'approved', 'rejected', 'scheduled', 'published'])
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'paused', 'archived'])
export const contentPlanStatusEnum = pgEnum('content_plan_status', ['draft', 'approved', 'exported', 'manually_posted', 'cancelled'])
export const exportPackageStatusEnum = pgEnum('export_package_status', ['ready', 'downloaded', 'archived'])
export const moderationRatingEnum = pgEnum('moderation_rating', ['safe', 'borderline', 'rejected'])
export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'admin', 'member', 'viewer'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  adultModeEnabled: boolean('adult_mode_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: workspaceRoleEnum('role').default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workspaceUserUnique: uniqueIndex('workspace_user_unique').on(table.workspaceId, table.userId),
}))

export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  triggerWord: varchar('trigger_word', { length: 100 }),
  isAdult: boolean('is_adult').default(true).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  niche: varchar('niche', { length: 255 }),
  audience: text('audience'),
  backstory: text('backstory'),
  personalityTraits: jsonb('personality_traits').$type<string[]>().default([]),
  toneOfVoice: text('tone_of_voice'),
  languages: jsonb('languages').$type<string[]>().default(['pt-BR']),
  contentPillars: jsonb('content_pillars').$type<string[]>().default([]),
  visualStyle: text('visual_style'),
  boundaries: text('boundaries'),
  sfwPolicy: text('sfw_policy'),
  nsfwPolicy: text('nsfw_policy'),
  disclosureNote: text('disclosure_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('characters_workspace_idx').on(table.workspaceId),
}))


export const characterPhotos = pgTable('character_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  r2Key: varchar('r2_key', { length: 500 }).notNull(),
  bucket: varchar('bucket', { length: 255 }),
  url: varchar('url', { length: 1000 }),
  visibility: varchar('visibility', { length: 50 }).default('private').notNull(),
  contentType: varchar('content_type', { length: 100 }),
  sizeBytes: integer('size_bytes'),
  checksum: varchar('checksum', { length: 255 }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  platform: platformEnum('platform').notNull(),
  contentRating: contentRatingEnum('content_rating').default('sfw').notNull(),
  mediaType: generationTypeEnum('media_type').notNull(),
  template: text('template').notNull(),
  negativePrompt: text('negative_prompt'),
  variables: jsonb('variables').$type<string[]>(),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const contentCampaigns = pgTable('content_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  goal: varchar('goal', { length: 255 }),
  platform: platformEnum('platform').notNull(),
  contentRating: contentRatingEnum('content_rating').default('sfw').notNull(),
  status: campaignStatusEnum('status').default('draft').notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceStatusIdx: index('content_campaigns_workspace_status_idx').on(table.workspaceId, table.status),
  workspaceCharacterIdx: index('content_campaigns_workspace_character_idx').on(table.workspaceId, table.characterId),
}))

export const contentIdeas = pgTable('content_ideas', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').notNull().references(() => contentCampaigns.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  hook: text('hook'),
  captionDraft: text('caption_draft'),
  hashtags: jsonb('hashtags').$type<string[]>(),
  platform: platformEnum('platform').notNull(),
  status: varchar('status', { length: 50 }).default('idea').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceCampaignIdx: index('content_ideas_workspace_campaign_idx').on(table.workspaceId, table.campaignId),
}))

export const generations = pgTable('generations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'set null' }),
  campaignId: uuid('campaign_id').references(() => contentCampaigns.id, { onDelete: 'set null' }),
  promptTemplateId: uuid('prompt_template_id').references(() => promptTemplates.id, { onDelete: 'set null' }),
  type: generationTypeEnum('type').notNull(),
  platform: platformEnum('platform').default('instagram').notNull(),
  contentRating: contentRatingEnum('content_rating').default('sfw').notNull(),
  prompt: text('prompt').notNull(),
  finalPrompt: text('final_prompt'),
  negativePrompt: text('negative_prompt'),
  status: generationStatusEnum('status').default('queued').notNull(),
  r2Key: varchar('r2_key', { length: 500 }),
  bucket: varchar('bucket', { length: 255 }),
  url: varchar('url', { length: 1000 }),
  visibility: varchar('visibility', { length: 50 }).default('private').notNull(),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),
  provider: providerEnum('provider'),
  model: varchar('model', { length: 100 }),
  modelVersion: varchar('model_version', { length: 100 }),
  referencePhotoUrl: varchar('reference_photo_url', { length: 1000 }),
  generationSettings: jsonb('generation_settings'),
  metadata: jsonb('metadata'),
  error: text('error'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdempotencyUnique: uniqueIndex('generations_workspace_idempotency_unique').on(table.workspaceId, table.idempotencyKey),
  workspaceStatusCreatedIdx: index('generations_workspace_status_created_idx').on(table.workspaceId, table.status, table.createdAt),
  workspaceCharacterIdx: index('generations_workspace_character_idx').on(table.workspaceId, table.characterId),
  workspaceCampaignIdx: index('generations_workspace_campaign_idx').on(table.workspaceId, table.campaignId),
}))

export const contentAssets = pgTable('content_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').references(() => contentCampaigns.id, { onDelete: 'set null' }),
  generationId: uuid('generation_id').references(() => generations.id, { onDelete: 'cascade' }),
  assetType: varchar('asset_type', { length: 50 }).notNull(),
  platform: platformEnum('platform').notNull(),
  contentRating: contentRatingEnum('content_rating').default('sfw').notNull(),
  status: assetStatusEnum('status').default('generated').notNull(),
  safetyRating: moderationRatingEnum('safety_rating'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceStatusIdx: index('content_assets_workspace_status_idx').on(table.workspaceId, table.status),
  workspaceCampaignIdx: index('content_assets_workspace_campaign_idx').on(table.workspaceId, table.campaignId),
  generationIdx: index('content_assets_generation_idx').on(table.generationId),
}))

export const moderationResults = pgTable('moderation_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  generationId: uuid('generation_id').references(() => generations.id, { onDelete: 'cascade' }),
  contentAssetId: uuid('content_asset_id').references(() => contentAssets.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  rating: moderationRatingEnum('rating').notNull(),
  detectedIssues: jsonb('detected_issues').$type<string[]>(),
  suggestedFixes: jsonb('suggested_fixes').$type<string[]>(),
  rawResult: jsonb('raw_result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  generationIdx: index('moderation_results_generation_idx').on(table.generationId),
  contentAssetIdx: index('moderation_results_content_asset_idx').on(table.contentAssetId),
  workspaceRatingIdx: index('moderation_results_workspace_rating_idx').on(table.workspaceId, table.rating),
}))

export const contentPlans = pgTable('content_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  contentAssetId: uuid('content_asset_id').notNull().references(() => contentAssets.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  plannedFor: timestamp('planned_for'),
  caption: text('caption'),
  hashtags: jsonb('hashtags').$type<string[]>(),
  platformNotes: text('platform_notes'),
  status: contentPlanStatusEnum('status').default('draft').notNull(),
  manuallyPostedAt: timestamp('manually_posted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceStatusPlannedIdx: index('content_plans_workspace_status_planned_idx').on(table.workspaceId, table.status, table.plannedFor),
  contentAssetIdx: index('content_plans_content_asset_idx').on(table.contentAssetId),
}))

export const exportPackages = pgTable('export_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  contentAssetId: uuid('content_asset_id').notNull().references(() => contentAssets.id, { onDelete: 'cascade' }),
  contentPlanId: uuid('content_plan_id').references(() => contentPlans.id, { onDelete: 'set null' }),
  platform: platformEnum('platform').notNull(),
  caption: text('caption'),
  hashtags: jsonb('hashtags').$type<string[]>(),
  platformNotes: text('platform_notes'),
  checklist: jsonb('checklist').$type<string[]>(),
  metadata: jsonb('metadata'),
  r2ZipKey: varchar('r2_zip_key', { length: 500 }),
  bucket: varchar('bucket', { length: 255 }),
  status: exportPackageStatusEnum('status').default('ready').notNull(),
  downloadedAt: timestamp('downloaded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workspaceStatusIdx: index('export_packages_workspace_status_idx').on(table.workspaceId, table.status),
  contentPlanIdx: index('export_packages_content_plan_idx').on(table.contentPlanId),
}))

export const generationCosts = pgTable('generation_costs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  generationId: uuid('generation_id').notNull().references(() => generations.id, { onDelete: 'cascade' }),
  provider: providerEnum('provider').notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  inputUnits: integer('input_units'),
  outputUnits: integer('output_units'),
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 10, scale: 4 }),
  actualCostUsd: decimal('actual_cost_usd', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workspaceCreatedIdx: index('generation_costs_workspace_created_idx').on(table.workspaceId, table.createdAt),
  generationIdx: index('generation_costs_generation_idx').on(table.generationId),
}))

export const usageQuotas = pgTable('usage_quotas', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  monthlyImageLimit: integer('monthly_image_limit').default(500).notNull(),
  monthlyVideoLimit: integer('monthly_video_limit').default(50).notNull(),
  monthlySpendLimitUsd: decimal('monthly_spend_limit_usd', { precision: 10, scale: 2 }).default('100.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceUnique: uniqueIndex('usage_quotas_workspace_unique').on(table.workspaceId),
}))
