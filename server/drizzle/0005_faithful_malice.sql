CREATE TYPE "public"."review_type" AS ENUM('initial', 'fraud');--> statement-breakpoint
CREATE TYPE "public"."ship_status" AS ENUM('pre-initial', 'voting', 'pre-fraud', 'failed', 'finished');--> statement-breakpoint
ALTER TYPE "public"."category" ADD VALUE 'App Development';--> statement-breakpoint
ALTER TYPE "public"."category" ADD VALUE 'Desktop App Development';--> statement-breakpoint
CREATE TABLE "project_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "review_type" NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"shipId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_ship" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"totalTime" integer NOT NULL,
	"loggedTime" integer NOT NULL,
	"state" "ship_status" DEFAULT 'pre-initial' NOT NULL,
	"projectId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_shipId_project_ship_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ship"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ship" ADD CONSTRAINT "project_ship_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;