CREATE TYPE "public"."user_types" AS ENUM('participant', 'reviewer', 'fraud', 'admin');--> statement-breakpoint
CREATE TABLE "project_stats" (
	"projectId" uuid PRIMARY KEY NOT NULL,
	"mu" real DEFAULT 25 NOT NULL,
	"sigma" real DEFAULT 8.333 NOT NULL,
	"ordinal" real DEFAULT 0 NOT NULL,
	"matchups" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"sessionId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	"shipId" uuid NOT NULL,
	"technicality" integer DEFAULT 0 NOT NULL,
	"documentation" integer DEFAULT 0 NOT NULL,
	"creativity" integer DEFAULT 0 NOT NULL,
	"implementation" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ratings_sessionId_shipId_pk" PRIMARY KEY("sessionId","shipId")
);
--> statement-breakpoint
CREATE TABLE "voting_group_ships" (
	"groupId" uuid NOT NULL,
	"shipId" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "voting_group_ships_groupId_shipId_pk" PRIMARY KEY("groupId","shipId"),
	CONSTRAINT "position_range" CHECK ("voting_group_ships"."position" BETWEEN 1 AND 4)
);
--> statement-breakpoint
CREATE TABLE "voting_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"sessionId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"voterId" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_reviews" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."review_type";--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('pre-initial', 'pre-fraud');--> statement-breakpoint
ALTER TABLE "project_reviews" ALTER COLUMN "type" SET DATA TYPE "public"."review_type" USING "type"::"public"."review_type";--> statement-breakpoint
ALTER TABLE "project_reviews" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_reviews" ADD COLUMN "comment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "project_reviews" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "project_reviews" ADD COLUMN "reviewerId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "project_ship" ADD COLUMN "timeSpent" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "type" "user_types" DEFAULT 'participant' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project_stats" ADD CONSTRAINT "project_stats_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_sessionId_voting_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."voting_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_groupId_voting_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."voting_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_shipId_project_ship_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ship"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_group_ships" ADD CONSTRAINT "voting_group_ships_groupId_voting_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."voting_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_group_ships" ADD CONSTRAINT "voting_group_ships_shipId_project_ship_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ship"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_groups" ADD CONSTRAINT "voting_groups_sessionId_voting_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."voting_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_sessions" ADD CONSTRAINT "voting_sessions_voterId_users_id_fk" FOREIGN KEY ("voterId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_reviewerId_users_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "staff";