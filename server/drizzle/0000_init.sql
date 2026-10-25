CREATE TYPE "public"."user_types" AS ENUM('participant', 'reviewer', 'fraud', 'admin');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('CAD', 'Game Development', 'Web Development', 'PCB Design', 'App Development', 'Desktop App Development');--> statement-breakpoint
CREATE TYPE "public"."ship_status" AS ENUM('pre-initial', 'voting', 'pre-fraud', 'failed', 'pre-payout', 'finished');--> statement-breakpoint
CREATE TYPE "public"."entry_types" AS ENUM('devlog', 'manual', 'htlink');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nickname" text NOT NULL,
	"ysws_eligible" boolean NOT NULL,
	"verification_status" text NOT NULL,
	"slack_id" text NOT NULL,
	"type" "user_types" DEFAULT 'participant' NOT NULL,
	"banned" boolean DEFAULT false,
	"coins" integer DEFAULT 0 NOT NULL,
	"regionId" uuid,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english',name || email || id || slack_id || nickname)) STORED,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"address_first_line" text NOT NULL,
	"address_second_line" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devlog_attachments" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"cdnURL" text PRIMARY KEY NOT NULL,
	"devlogId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_devlogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"projectId" uuid NOT NULL,
	"timeEntryId" uuid NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "joe_fraud_reviews" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"finishedAt" timestamp,
	"shipId" uuid PRIMARY KEY NOT NULL,
	"joeProjectId" uuid NOT NULL,
	"confidence" integer,
	"passed" boolean
);
--> statement-breakpoint
CREATE TABLE "project_locks" (
	"projectId" uuid NOT NULL,
	"shipId" uuid NOT NULL,
	"lockedAt" timestamp DEFAULT now() NOT NULL,
	"unlockedAt" timestamp,
	CONSTRAINT "project_locks_projectId_shipId_pk" PRIMARY KEY("projectId","shipId")
);
--> statement-breakpoint
CREATE TABLE "project_reviews" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"shipId" uuid PRIMARY KEY NOT NULL,
	"comment" text NOT NULL,
	"note" text,
	"reviewerId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_ships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"state" "ship_status" DEFAULT 'pre-initial' NOT NULL,
	"payout" integer,
	"projectId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"demoLink" text,
	"repository" text NOT NULL,
	"readmeLink" text,
	"category" "category" NOT NULL,
	"totalTime" integer DEFAULT 0 NOT NULL,
	"creatorId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_stats" (
	"projectId" uuid PRIMARY KEY NOT NULL,
	"mu" real DEFAULT 25 NOT NULL,
	"sigma" real DEFAULT 8.333333333333334 NOT NULL,
	"ordinal" real DEFAULT 0 NOT NULL,
	"matchups" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"roundId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"technicality" integer DEFAULT 0 NOT NULL,
	"documentation" integer DEFAULT 0 NOT NULL,
	"creativity" integer DEFAULT 0 NOT NULL,
	"implementation" integer DEFAULT 0 NOT NULL,
	"feedback" text NOT NULL,
	CONSTRAINT "ratings_roundId_projectId_pk" PRIMARY KEY("roundId","projectId")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"userId" text PRIMARY KEY NOT NULL,
	"votesCast" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_round_projects" (
	"roundId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "voting_round_projects_roundId_projectId_pk" PRIMARY KEY("roundId","projectId"),
	CONSTRAINT "position_range" CHECK ("voting_round_projects"."position" BETWEEN 1 AND 4)
);
--> statement-breakpoint
CREATE TABLE "voting_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"voterId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_item_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"optionId" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_order_item_variant" (
	"orderId" uuid NOT NULL,
	"variantId" uuid NOT NULL,
	CONSTRAINT "shop_order_item_variant_orderId_variantId_pk" PRIMARY KEY("orderId","variantId")
);
--> statement-breakpoint
CREATE TABLE "shop_item_regional_availabilities" (
	"itemId" uuid NOT NULL,
	"regionId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"available" boolean DEFAULT false NOT NULL,
	"quantity" integer,
	"price" integer NOT NULL,
	CONSTRAINT "shop_item_regional_availabilities_itemId_regionId_pk" PRIMARY KEY("itemId","regionId")
);
--> statement-breakpoint
CREATE TABLE "shop_item_variant_regional_availabilities" (
	"variantId" uuid NOT NULL,
	"regionId" uuid NOT NULL,
	"price" integer NOT NULL,
	CONSTRAINT "shop_item_variant_regional_availabilities_variantId_regionId_pk" PRIMARY KEY("variantId","regionId")
);
--> statement-breakpoint
CREATE TABLE "shop_item_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itemId" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "shop_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placedAt" timestamp DEFAULT now() NOT NULL,
	"fulfilledAt" timestamp,
	"itemId" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"addressId" uuid NOT NULL,
	"price" integer NOT NULL,
	"trackingId" text,
	"orderNotes" text,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "shop_regions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "time_corrections" (
	"timeEntryId" uuid PRIMARY KEY NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"duration" integer NOT NULL,
	"timeAnchor" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"type" "entry_types" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_hackatime_links" (
	"timeEntryId" uuid PRIMARY KEY NOT NULL,
	"hackatimeProjectName" text NOT NULL,
	"link" boolean NOT NULL,
	"projectId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_ship_snapshots" (
	"timeEntryId" uuid PRIMARY KEY NOT NULL,
	"shipId" uuid
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_regionId_shop_regions_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."shop_regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devlog_attachments" ADD CONSTRAINT "devlog_attachments_devlogId_project_devlogs_id_fk" FOREIGN KEY ("devlogId") REFERENCES "public"."project_devlogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_devlogs" ADD CONSTRAINT "project_devlogs_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_devlogs" ADD CONSTRAINT "project_devlogs_timeEntryId_time_entries_id_fk" FOREIGN KEY ("timeEntryId") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joe_fraud_reviews" ADD CONSTRAINT "joe_fraud_reviews_shipId_project_ships_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_locks" ADD CONSTRAINT "project_locks_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_locks" ADD CONSTRAINT "project_locks_shipId_project_ships_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_shipId_project_ships_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_reviewerId_users_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ships" ADD CONSTRAINT "project_ships_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_creatorId_users_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stats" ADD CONSTRAINT "project_stats_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_roundId_voting_rounds_id_fk" FOREIGN KEY ("roundId") REFERENCES "public"."voting_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_round_projects" ADD CONSTRAINT "voting_round_projects_roundId_voting_rounds_id_fk" FOREIGN KEY ("roundId") REFERENCES "public"."voting_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_round_projects" ADD CONSTRAINT "voting_round_projects_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_rounds" ADD CONSTRAINT "voting_rounds_voterId_users_id_fk" FOREIGN KEY ("voterId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_variants" ADD CONSTRAINT "shop_item_variants_optionId_shop_item_options_id_fk" FOREIGN KEY ("optionId") REFERENCES "public"."shop_item_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD CONSTRAINT "shop_order_item_variant_orderId_shop_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."shop_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD CONSTRAINT "shop_order_item_variant_variantId_shop_item_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."shop_item_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_regional_availabilities" ADD CONSTRAINT "shop_item_regional_availabilities_itemId_shop_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."shop_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_regional_availabilities" ADD CONSTRAINT "shop_item_regional_availabilities_regionId_shop_regions_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."shop_regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_variant_regional_availabilities" ADD CONSTRAINT "shop_item_variant_regional_availabilities_variantId_shop_item_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."shop_item_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_variant_regional_availabilities" ADD CONSTRAINT "shop_item_variant_regional_availabilities_regionId_shop_regions_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."shop_regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_options" ADD CONSTRAINT "shop_item_options_itemId_shop_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."shop_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_itemId_shop_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."shop_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_addressId_addresses_id_fk" FOREIGN KEY ("addressId") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_corrections" ADD CONSTRAINT "time_corrections_timeEntryId_time_entries_id_fk" FOREIGN KEY ("timeEntryId") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_hackatime_links" ADD CONSTRAINT "time_hackatime_links_timeEntryId_time_entries_id_fk" FOREIGN KEY ("timeEntryId") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_hackatime_links" ADD CONSTRAINT "time_hackatime_links_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_ship_snapshots" ADD CONSTRAINT "time_ship_snapshots_timeEntryId_time_entries_id_fk" FOREIGN KEY ("timeEntryId") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_ship_snapshots" ADD CONSTRAINT "time_ship_snapshots_shipId_project_ships_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_slack_id_idx" ON "users" USING btree ("slack_id");--> statement-breakpoint
CREATE INDEX "users_search_idx" ON "users" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");