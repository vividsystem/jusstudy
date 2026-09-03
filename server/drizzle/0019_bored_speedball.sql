DELETE FROM "accounts";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "issuer" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_issuer_accountId_uidx" ON "accounts" USING btree ("issuer","account_id");
