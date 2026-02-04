CREATE TYPE "public"."category" AS ENUM('CAD', 'Game Development', 'Web Development', 'PCB Design', 'Art', 'Music');--> statement-breakpoint
ALTER TABLE "project_devlogs" ALTER COLUMN "timeSpent" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "category" "category" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "staff" boolean DEFAULT false;