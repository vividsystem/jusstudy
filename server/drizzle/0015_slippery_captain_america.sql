ALTER TABLE "shop_order_item_variant" DROP CONSTRAINT "shop_order_item_variant_optionId_shop_item_options_id_fk";
--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" DROP CONSTRAINT "shop_order_item_variant_orderId_optionId_pk";--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD CONSTRAINT "shop_order_item_variant_orderId_variantId_pk" PRIMARY KEY("orderId","variantId");--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD COLUMN "variantId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD CONSTRAINT "shop_order_item_variant_variantId_shop_item_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."shop_item_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" DROP COLUMN "optionId";