CREATE TABLE "project_locks" (
	"projectId" uuid NOT NULL,
	"shipId" uuid NOT NULL,
	"lockedAt" timestamp DEFAULT now() NOT NULL,
	"unlockedAt" timestamp,
	CONSTRAINT "project_locks_projectId_shipId_pk" PRIMARY KEY("projectId","shipId")
);
--> statement-breakpoint
ALTER TABLE "project_ship" RENAME TO "project_ships";--> statement-breakpoint
ALTER TABLE "joe_fraud_reviews" DROP CONSTRAINT "joe_fraud_reviews_shipId_project_ship_id_fk";
--> statement-breakpoint
ALTER TABLE "project_reviews" DROP CONSTRAINT "project_reviews_shipId_project_ship_id_fk";
--> statement-breakpoint
ALTER TABLE "project_ships" DROP CONSTRAINT "project_ship_projectId_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "feedback" text NOT NULL;--> statement-breakpoint
ALTER TABLE "project_locks" ADD CONSTRAINT "project_locks_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_locks" ADD CONSTRAINT "project_locks_shipId_project_ships_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joe_fraud_reviews" ADD CONSTRAINT "joe_fraud_reviews_shipId_project_ships_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_shipId_project_ships_id_fk" FOREIGN KEY ("shipId") REFERENCES "public"."project_ships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ships" ADD CONSTRAINT "project_ships_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;