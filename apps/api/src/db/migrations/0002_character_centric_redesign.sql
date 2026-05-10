-- Add persona columns to characters table
ALTER TABLE "characters" ADD COLUMN "display_name" varchar(255);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "niche" varchar(255);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "audience" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "backstory" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "personality_traits" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "tone_of_voice" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "languages" jsonb DEFAULT '["pt-BR"]'::jsonb;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "content_pillars" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "visual_style" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "boundaries" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "sfw_policy" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "nsfw_policy" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "disclosure_note" text;--> statement-breakpoint
-- Drop FK constraint on generations.influencer_profile_id before dropping the column
ALTER TABLE "generations" DROP CONSTRAINT "generations_influencer_profile_id_influencer_profiles_id_fk";--> statement-breakpoint
ALTER TABLE "generations" DROP COLUMN "influencer_profile_id";--> statement-breakpoint
-- Drop old index on content_campaigns that referenced influencer_profile_id
DROP INDEX "content_campaigns_workspace_persona_idx";--> statement-breakpoint
-- Drop FK constraint on content_campaigns.influencer_profile_id before replacing column
ALTER TABLE "content_campaigns" DROP CONSTRAINT "content_campaigns_influencer_profile_id_influencer_profiles_id_fk";--> statement-breakpoint
-- Add character_id as nullable first, then backfill from influencer_profiles, then set NOT NULL
ALTER TABLE "content_campaigns" ADD COLUMN "character_id" uuid;--> statement-breakpoint
UPDATE "content_campaigns" cc
  SET "character_id" = ip."character_id"
  FROM "influencer_profiles" ip
  WHERE cc."influencer_profile_id" = ip."id";--> statement-breakpoint
ALTER TABLE "content_campaigns" ALTER COLUMN "character_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "content_campaigns" DROP COLUMN "influencer_profile_id";--> statement-breakpoint
-- Add FK for character_id on content_campaigns
ALTER TABLE "content_campaigns" ADD CONSTRAINT "content_campaigns_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Add new index on content_campaigns for character_id
CREATE INDEX "content_campaigns_workspace_character_idx" ON "content_campaigns" USING btree ("workspace_id","character_id");--> statement-breakpoint
-- Drop influencer_profiles table (dependencies already removed above)
DROP INDEX "influencer_profiles_workspace_character_idx";--> statement-breakpoint
ALTER TABLE "influencer_profiles" DROP CONSTRAINT "influencer_profiles_workspace_id_workspaces_id_fk";--> statement-breakpoint
ALTER TABLE "influencer_profiles" DROP CONSTRAINT "influencer_profiles_character_id_characters_id_fk";--> statement-breakpoint
DROP TABLE "influencer_profiles";
