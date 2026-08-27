CREATE TYPE "public"."entry_types" AS ENUM('devlog', 'manual', 'snapshot', 'htlink'); --> statement-breakpoint
CREATE TABLE "time_corrections" (
	"timeEntryId" uuid PRIMARY KEY NOT NULL,
	"reason" text NOT NULL
); --> statement-breakpoint

CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"duration" integer NOT NULL,
	"timeAnchor" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"type" "entry_types" NOT NULL
); --> statement-breakpoint

INSERT INTO "time_entries" (
	"projectId",
	"duration",
	"timeAnchor",
	"createdAt",
	"createdBy",
	"type"
)
SELECT
	d."projectId",
	d."timeSpent",
	d."totalTimeSpent",
	d."createdAt",
	p."creatorId",
	'devlog'
FROM "project_devlogs" d
INNER JOIN projects p
	ON d."projectId" = p.id; --> statement-breakpoint

CREATE TABLE "time_hackatime_links" (
	"timeEntryId" uuid PRIMARY KEY NOT NULL,
	"hackatimeProjectName" text NOT NULL,
	"link" boolean NOT NULL,
	"projectId" uuid NOT NULL
); --> statement-breakpoint

INSERT INTO "time_entries" (
	"projectId",
	"duration",
	"timeAnchor",
	"createdAt",
	"createdBy",
	"type"
)
SELECT
	h."projectId",
	0,
	COALESCE(MAX(te."timeAnchor"), 0),
	h."createdAt",
	p."creatorId",
	'htlink'
FROM "hackatime_project_links" h
INNER JOIN projects p
	ON h."projectId" = p.id
LEFT JOIN "time_entries" te
	ON h."projectId" = te."projectId"
GROUP BY
	h."hackatimeProjectId",
	h."projectId",
	h."createdAt",
	p."creatorId"; --> statement-breakpoint

INSERT INTO "time_hackatime_links" (
	"timeEntryId",
	"hackatimeProjectName",
	"link",
	"projectId"
)
SELECT
	e."id",
	h_old."hackatimeProjectId",
	TRUE,
	e."projectId"
FROM "time_entries" e
INNER JOIN "hackatime_project_links" h_old
	ON e."createdAt" = h_old."createdAt"
	AND e."projectId" = h_old."projectId"
WHERE
	e."type" = 'htlink'; --> statement-breakpoint

CREATE TABLE "time_ship_snapshots" (
	"timeEntryId" uuid PRIMARY KEY NOT NULL,
	"shipId" uuid
); --> statement-breakpoint


ALTER TABLE "project_devlogs" ADD COLUMN "timeEntryId" uuid;--> statement-breakpoint

WITH entries AS (
	SELECT 
		id, 
		"projectId", 
		"type", 
		"createdAt"
	FROM "time_entries"
	WHERE "type" = 'devlog'
)
UPDATE "project_devlogs" AS devlogs
SET "timeEntryId" = entries.id
FROM entries
WHERE entries."createdAt" = devlogs."createdAt"
	AND entries."projectId" = devlogs."projectId";
--> statement-breakpoint

ALTER TABLE "project_devlogs"
ALTER COLUMN "timeEntryId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "hackatime_project_links" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "hackatime_project_links" CASCADE;--> statement-breakpoint

ALTER TABLE "projects" ADD COLUMN "totalTime" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH entries AS (
	SELECT 
		SUM("duration") as time, 
		"projectId"
	FROM "time_entries"
	GROUP BY "projectId"
)
UPDATE "projects" as p
SET "totalTime" = entries.time
FROM entries
WHERE entries."projectId" = p.id;--> statement-breakpoint

ALTER TABLE "time_corrections" ADD CONSTRAINT "time_corrections_timeEntryId_time_entries_id_fk" FOREIGN KEY ("timeEntryId") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_hackatime_links" ADD CONSTRAINT "time_hackatime_links_timeEntryId_time_entries_id_fk" FOREIGN KEY ("timeEntryId") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_hackatime_links" ADD CONSTRAINT "time_hackatime_links_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_ship_snapshots" ADD CONSTRAINT "time_ship_snapshots_timeEntryId_time_entries_id_fk" FOREIGN KEY ("timeEntryId") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_ship_snapshots" ADD CONSTRAINT "time_ship_snapshots_shipId_project_ships_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_devlogs" ADD CONSTRAINT "project_devlogs_timeEntryId_time_entries_id_fk" FOREIGN KEY ("timeEntryId") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_devlogs" DROP COLUMN "timeSpent";--> statement-breakpoint
ALTER TABLE "project_devlogs" DROP COLUMN "totalTimeSpent";
