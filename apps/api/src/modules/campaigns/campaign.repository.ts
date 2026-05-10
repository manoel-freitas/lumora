import { and, desc, eq } from 'drizzle-orm'
import type { CreateCampaignInput, CreateContentIdeaInput, UpdateCampaignInput } from '@lumora/shared'
import { db } from '../../infra/db'
import { contentAssets, contentCampaigns, contentIdeas, influencerProfiles } from '../../db/schema'

export async function listCampaigns(workspaceId: string) {
  return db.query.contentCampaigns.findMany({
    where: eq(contentCampaigns.workspaceId, workspaceId),
    orderBy: [desc(contentCampaigns.createdAt)],
  })
}

export async function personaBelongsToWorkspace(workspaceId: string, influencerProfileId: string) {
  const persona = await db.query.influencerProfiles.findFirst({
    where: and(eq(influencerProfiles.workspaceId, workspaceId), eq(influencerProfiles.id, influencerProfileId)),
  })
  return Boolean(persona)
}

export async function findCampaign(workspaceId: string, id: string) {
  const campaign = await db.query.contentCampaigns.findFirst({
    where: and(eq(contentCampaigns.workspaceId, workspaceId), eq(contentCampaigns.id, id)),
  })
  if (!campaign) return null

  const [ideas, assets] = await Promise.all([
    db.query.contentIdeas.findMany({
      where: and(eq(contentIdeas.workspaceId, workspaceId), eq(contentIdeas.campaignId, id)),
      orderBy: [desc(contentIdeas.createdAt)],
    }),
    db.query.contentAssets.findMany({
      where: and(eq(contentAssets.workspaceId, workspaceId), eq(contentAssets.campaignId, id)),
      orderBy: [desc(contentAssets.createdAt)],
    }),
  ])

  return { ...campaign, ideas, assets }
}

type CampaignWrite = CreateCampaignInput | {
  influencerProfileId: string
  name: string
  goal?: string
  platform: CreateCampaignInput['platform']
  contentRating?: CreateCampaignInput['contentRating']
  startsAt?: string
  endsAt?: string
}

type IdeaWrite = CreateContentIdeaInput | {
  title: string
  description?: string
  hook?: string
  captionDraft?: string
  hashtags?: string[]
  platform: CreateContentIdeaInput['platform']
}

export async function createCampaign(workspaceId: string, data: CampaignWrite) {
  const [campaign] = await db.insert(contentCampaigns).values({
    workspaceId,
    influencerProfileId: data.influencerProfileId,
    name: data.name,
    goal: data.goal,
    platform: data.platform,
    contentRating: data.contentRating ?? 'sfw',
    startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
    endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
  }).returning()
  return campaign
}

export async function updateCampaign(workspaceId: string, id: string, data: UpdateCampaignInput) {
  const [campaign] = await db.update(contentCampaigns)
    .set({
      influencerProfileId: data.influencerProfileId,
      name: data.name,
      goal: data.goal,
      platform: data.platform,
      contentRating: data.contentRating,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(contentCampaigns.workspaceId, workspaceId), eq(contentCampaigns.id, id)))
    .returning()

  return campaign || null
}

export async function deleteCampaign(workspaceId: string, id: string) {
  const [campaign] = await db.delete(contentCampaigns)
    .where(and(eq(contentCampaigns.workspaceId, workspaceId), eq(contentCampaigns.id, id)))
    .returning()
  return Boolean(campaign)
}

export async function createCampaignIdea(workspaceId: string, campaignId: string, data: IdeaWrite) {
  const [idea] = await db.insert(contentIdeas).values({
    workspaceId,
    campaignId,
    title: data.title,
    description: data.description,
    hook: data.hook,
    captionDraft: data.captionDraft,
    hashtags: data.hashtags ?? [],
    platform: data.platform,
  }).returning()
  return idea
}
