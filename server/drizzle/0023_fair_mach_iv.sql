CREATE TABLE "shop_item_regional_availabilities" (
	"itemId" uuid,
	"regionId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"available" boolean DEFAULT false,
	"quantity" integer,
	"price" integer NOT NULL,
	CONSTRAINT "shop_item_regional_availabilities_itemId_regionId_pk" PRIMARY KEY("itemId","regionId")
);
--> statement-breakpoint
CREATE TABLE "shop_item_variant_regional_availabilities" (
	"variantId" uuid,
	"regionId" uuid,
	"price" integer NOT NULL,
	CONSTRAINT "shop_item_variant_regional_availabilities_variantId_regionId_pk" PRIMARY KEY("variantId","regionId")
);
--> statement-breakpoint
CREATE TABLE "shop_regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shop_item_regional_availabilities" ADD CONSTRAINT "shop_item_regional_availabilities_itemId_shop_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."shop_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_regional_availabilities" ADD CONSTRAINT "shop_item_regional_availabilities_regionId_shop_regions_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."shop_regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_variant_regional_availabilities" ADD CONSTRAINT "shop_item_variant_regional_availabilities_variantId_shop_item_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."shop_item_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_variant_regional_availabilities" ADD CONSTRAINT "shop_item_variant_regional_availabilities_regionId_shop_regions_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."shop_regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_variants" DROP COLUMN "additionalPrice";--> statement-breakpoint
ALTER TABLE "shop_items" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "shop_items" DROP COLUMN "basePrice";