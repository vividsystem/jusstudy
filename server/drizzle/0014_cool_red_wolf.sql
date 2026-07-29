ALTER TABLE "shop_item_variant" RENAME TO "shop_order_item_variant";--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" DROP CONSTRAINT "shop_item_variant_orderId_shop_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" DROP CONSTRAINT "shop_item_variant_optionId_shop_item_options_id_fk";
--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" DROP CONSTRAINT "shop_item_variant_orderId_optionId_pk";--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD CONSTRAINT "shop_order_item_variant_orderId_optionId_pk" PRIMARY KEY("orderId","optionId");--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD CONSTRAINT "shop_order_item_variant_orderId_shop_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."shop_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD CONSTRAINT "shop_order_item_variant_optionId_shop_item_options_id_fk" FOREIGN KEY ("optionId") REFERENCES "public"."shop_item_options"("id") ON DELETE no action ON UPDATE no action;