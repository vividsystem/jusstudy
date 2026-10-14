DROP INDEX "accounts_issuer_accountId_uidx";--> statement-breakpoint
ALTER TABLE "shop_item_variant_regional_availabilities" ALTER COLUMN "variantId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_item_variant_regional_availabilities" ALTER COLUMN "regionId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "issuer";--> statement-breakpoint
ALTER TABLE "shop_regions" ADD CONSTRAINT "shop_regions_name_unique" UNIQUE("name");