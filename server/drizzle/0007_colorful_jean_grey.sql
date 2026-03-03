ALTER TABLE "ratings" DROP CONSTRAINT "ratings_shipId_project_ship_id_fk";
--> statement-breakpoint
ALTER TABLE "voting_group_ships" DROP CONSTRAINT "voting_group_ships_shipId_project_ship_id_fk";
--> statement-breakpoint
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_sessionId_shipId_pk";--> statement-breakpoint
ALTER TABLE "voting_group_ships" DROP CONSTRAINT "voting_group_ships_groupId_shipId_pk";--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_sessionId_projectId_pk" PRIMARY KEY("sessionId","projectId");--> statement-breakpoint
ALTER TABLE "voting_group_ships" ADD CONSTRAINT "voting_group_ships_groupId_projectId_pk" PRIMARY KEY("groupId","projectId");--> statement-breakpoint
ALTER TABLE "project_stats" ADD COLUMN "isSettled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "projectId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "voting_group_ships" ADD COLUMN "projectId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_group_ships" ADD CONSTRAINT "voting_group_ships_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" DROP COLUMN "shipId";--> statement-breakpoint
ALTER TABLE "voting_group_ships" DROP COLUMN "shipId";