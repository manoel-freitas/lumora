CREATE TYPE "public"."asset_status" AS ENUM('generated', 'reviewed', 'approved', 'rejected', 'scheduled', 'published');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_plan_status" AS ENUM('draft', 'approved', 'exported', 'manually_posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."content_rating" AS ENUM('sfw', 'suggestive', 'adult');--> statement-breakpoint
CREATE TYPE "public"."export_package_status" AS ENUM('ready', 'downloaded', 'archived');--> statement-breakpoint
CREATE TYPE "public"."generation_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'moderation_failed');--> statement-breakpoint
CREATE TYPE "public"."generation_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."moderation_rating" AS ENUM('safe', 'borderline', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('together_ai', 'fal_ai');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TABLE "character_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"r2_key" varchar(500) NOT NULL,
	"bucket" varchar(255),
	"url" varchar(1000),
	"visibility" varchar(50) DEFAULT 'private' NOT NULL,
	"content_type" varchar(100),
	"size_bytes" integer,
	"checksum" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"trigger_word" varchar(100),
	"is_adult" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid,
	"generation_id" uuid,
	"asset_type" varchar(50) NOT NULL,
	"platform" "platform" NOT NULL,
	"content_rating" "content_rating" DEFAULT 'sfw' NOT NULL,
	"status" "asset_status" DEFAULT 'generated' NOT NULL,
	"safety_rating" "moderation_rating",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"influencer_profile_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"goal" varchar(255),
	"platform" "platform" NOT NULL,
	"content_rating" "content_rating" DEFAULT 'sfw' NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"hook" text,
	"caption_draft" text,
	"hashtags" jsonb,
	"platform" "platform" NOT NULL,
	"status" varchar(50) DEFAULT 'idea' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_asset_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"planned_for" timestamp,
	"caption" text,
	"hashtags" jsonb,
	"platform_notes" text,
	"status" "content_plan_status" DEFAULT 'draft' NOT NULL,
	"manually_posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"content_asset_id" uuid NOT NULL,
	"content_plan_id" uuid,
	"platform" "platform" NOT NULL,
	"caption" text,
	"hashtags" jsonb,
	"platform_notes" text,
	"checklist" jsonb,
	"metadata" jsonb,
	"r2_zip_key" varchar(500),
	"bucket" varchar(255),
	"status" "export_package_status" DEFAULT 'ready' NOT NULL,
	"downloaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"generation_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"model" varchar(100) NOT NULL,
	"input_units" integer,
	"output_units" integer,
	"estimated_cost_usd" numeric(10, 4),
	"actual_cost_usd" numeric(10, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"character_id" uuid,
	"influencer_profile_id" uuid,
	"campaign_id" uuid,
	"prompt_template_id" uuid,
	"type" "generation_type" NOT NULL,
	"platform" "platform" DEFAULT 'instagram' NOT NULL,
	"content_rating" "content_rating" DEFAULT 'sfw' NOT NULL,
	"prompt" text NOT NULL,
	"final_prompt" text,
	"negative_prompt" text,
	"status" "generation_status" DEFAULT 'queued' NOT NULL,
	"r2_key" varchar(500),
	"bucket" varchar(255),
	"url" varchar(1000),
	"visibility" varchar(50) DEFAULT 'private' NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"provider" "provider",
	"model" varchar(100),
	"model_version" varchar(100),
	"reference_photo_url" varchar(1000),
	"generation_settings" jsonb,
	"metadata" jsonb,
	"error" text,
	"idempotency_key" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "influencer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"niche" varchar(255),
	"audience" text,
	"backstory" text,
	"personality_traits" jsonb,
	"tone_of_voice" text,
	"languages" jsonb,
	"content_pillars" jsonb,
	"visual_style" text,
	"boundaries" text,
	"sfw_policy" text,
	"nsfw_policy" text,
	"disclosure_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"generation_id" uuid,
	"content_asset_id" uuid,
	"platform" "platform" NOT NULL,
	"rating" "moderation_rating" NOT NULL,
	"detected_issues" jsonb,
	"suggested_fixes" jsonb,
	"raw_result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"name" varchar(255) NOT NULL,
	"platform" "platform" NOT NULL,
	"content_rating" "content_rating" DEFAULT 'sfw' NOT NULL,
	"media_type" "generation_type" NOT NULL,
	"template" text NOT NULL,
	"negative_prompt" text,
	"variables" jsonb,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_quotas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"monthly_image_limit" integer DEFAULT 500 NOT NULL,
	"monthly_video_limit" integer DEFAULT 50 NOT NULL,
	"monthly_spend_limit_usd" numeric(10, 2) DEFAULT '100.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "workspace_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"adult_mode_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_photos" ADD CONSTRAINT "character_photos_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_photos" ADD CONSTRAINT "character_photos_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_campaign_id_content_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."content_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_campaigns" ADD CONSTRAINT "content_campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_campaigns" ADD CONSTRAINT "content_campaigns_influencer_profile_id_influencer_profiles_id_fk" FOREIGN KEY ("influencer_profile_id") REFERENCES "public"."influencer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_campaign_id_content_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."content_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_content_asset_id_content_assets_id_fk" FOREIGN KEY ("content_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_packages" ADD CONSTRAINT "export_packages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_packages" ADD CONSTRAINT "export_packages_content_asset_id_content_assets_id_fk" FOREIGN KEY ("content_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_packages" ADD CONSTRAINT "export_packages_content_plan_id_content_plans_id_fk" FOREIGN KEY ("content_plan_id") REFERENCES "public"."content_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_costs" ADD CONSTRAINT "generation_costs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_costs" ADD CONSTRAINT "generation_costs_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_influencer_profile_id_influencer_profiles_id_fk" FOREIGN KEY ("influencer_profile_id") REFERENCES "public"."influencer_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_campaign_id_content_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."content_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_prompt_template_id_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_profiles" ADD CONSTRAINT "influencer_profiles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_profiles" ADD CONSTRAINT "influencer_profiles_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_results" ADD CONSTRAINT "moderation_results_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_results" ADD CONSTRAINT "moderation_results_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_results" ADD CONSTRAINT "moderation_results_content_asset_id_content_assets_id_fk" FOREIGN KEY ("content_asset_id") REFERENCES "public"."content_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_quotas" ADD CONSTRAINT "usage_quotas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "characters_workspace_idx" ON "characters" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "content_assets_workspace_status_idx" ON "content_assets" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "content_assets_workspace_campaign_idx" ON "content_assets" USING btree ("workspace_id","campaign_id");--> statement-breakpoint
CREATE INDEX "content_assets_generation_idx" ON "content_assets" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "content_campaigns_workspace_status_idx" ON "content_campaigns" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "content_campaigns_workspace_persona_idx" ON "content_campaigns" USING btree ("workspace_id","influencer_profile_id");--> statement-breakpoint
CREATE INDEX "content_ideas_workspace_campaign_idx" ON "content_ideas" USING btree ("workspace_id","campaign_id");--> statement-breakpoint
CREATE INDEX "content_plans_workspace_status_planned_idx" ON "content_plans" USING btree ("workspace_id","status","planned_for");--> statement-breakpoint
CREATE INDEX "content_plans_content_asset_idx" ON "content_plans" USING btree ("content_asset_id");--> statement-breakpoint
CREATE INDEX "export_packages_workspace_status_idx" ON "export_packages" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "export_packages_content_plan_idx" ON "export_packages" USING btree ("content_plan_id");--> statement-breakpoint
CREATE INDEX "generation_costs_workspace_created_idx" ON "generation_costs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "generation_costs_generation_idx" ON "generation_costs" USING btree ("generation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "generations_workspace_idempotency_unique" ON "generations" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "generations_workspace_status_created_idx" ON "generations" USING btree ("workspace_id","status","created_at");--> statement-breakpoint
CREATE INDEX "generations_workspace_character_idx" ON "generations" USING btree ("workspace_id","character_id");--> statement-breakpoint
CREATE INDEX "generations_workspace_campaign_idx" ON "generations" USING btree ("workspace_id","campaign_id");--> statement-breakpoint
CREATE INDEX "influencer_profiles_workspace_character_idx" ON "influencer_profiles" USING btree ("workspace_id","character_id");--> statement-breakpoint
CREATE INDEX "moderation_results_generation_idx" ON "moderation_results" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "moderation_results_content_asset_idx" ON "moderation_results" USING btree ("content_asset_id");--> statement-breakpoint
CREATE INDEX "moderation_results_workspace_rating_idx" ON "moderation_results" USING btree ("workspace_id","rating");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_quotas_workspace_unique" ON "usage_quotas" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_user_unique" ON "workspace_members" USING btree ("workspace_id","user_id");