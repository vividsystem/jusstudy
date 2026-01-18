ALTER TABLE "hackatime_project_links" DROP CONSTRAINT "hackatime_project_links_hackatimeProjectId_unique";--> statement-breakpoint
ALTER TABLE "project_devlogs" ADD COLUMN "timeSpent" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "project_devlogs" ADD COLUMN "totalTimeSpent" integer NOT NULL;