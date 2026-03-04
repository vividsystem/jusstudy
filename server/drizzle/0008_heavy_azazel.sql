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
ALTER TABLE "voting_group_ships" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voting_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voting_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "voting_group_ships" CASCADE;--> statement-breakpoint
DROP TABLE "voting_groups" CASCADE;--> statement-breakpoint
DROP TABLE "voting_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "project_stats" DROP CONSTRAINT "project_stats_projectId_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_sessionId_voting_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_groupId_voting_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_sessionId_projectId_pk";--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "projectId" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_roundId_projectId_pk" PRIMARY KEY("roundId","projectId");--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "roundId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "voting_round_projects" ADD CONSTRAINT "voting_round_projects_roundId_voting_rounds_id_fk" FOREIGN KEY ("roundId") REFERENCES "public"."voting_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_round_projects" ADD CONSTRAINT "voting_round_projects_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_rounds" ADD CONSTRAINT "voting_rounds_voterId_users_id_fk" FOREIGN KEY ("voterId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_stats" ADD CONSTRAINT "project_stats_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_roundId_voting_rounds_id_fk" FOREIGN KEY ("roundId") REFERENCES "public"."voting_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "ratings" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "ratings" DROP COLUMN "sessionId";--> statement-breakpoint
ALTER TABLE "ratings" DROP COLUMN "groupId";