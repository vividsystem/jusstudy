ALTER TABLE "time_entries" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."entry_types";--> statement-breakpoint
CREATE TYPE "public"."entry_types" AS ENUM('devlog', 'manual', 'htlink');--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "type" SET DATA TYPE "public"."entry_types" USING "type"::"public"."entry_types";