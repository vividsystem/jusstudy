CREATE TABLE "shop_item_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"optionId" uuid NOT NULL,
	"name" text NOT NULL,
	"additionalPrice" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_item_variant" (
	"orderId" uuid NOT NULL,
	"optionId" uuid NOT NULL,
	CONSTRAINT "shop_item_variant_orderId_optionId_pk" PRIMARY KEY("orderId","optionId")
);
--> statement-breakpoint
CREATE TABLE "shop_item_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itemId" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shop_items" RENAME COLUMN "price" TO "basePrice";--> statement-breakpoint
ALTER TABLE "users" drop column "search_vector";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english',name || email || id || slack_id || nickname)) STORED;--> statement-breakpoint
ALTER TABLE "shop_item_variants" ADD CONSTRAINT "shop_item_variants_optionId_shop_item_options_id_fk" FOREIGN KEY ("optionId") REFERENCES "public"."shop_item_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_variant" ADD CONSTRAINT "shop_item_variant_orderId_shop_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."shop_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_variant" ADD CONSTRAINT "shop_item_variant_optionId_shop_item_options_id_fk" FOREIGN KEY ("optionId") REFERENCES "public"."shop_item_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_item_options" ADD CONSTRAINT "shop_item_options_itemId_shop_items_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."shop_items"("id") ON DELETE no action ON UPDATE no action;