ALTER TABLE "shop_order_item_variant" DROP CONSTRAINT "shop_order_item_variant_orderId_shop_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "shop_order_item_variant" ADD CONSTRAINT "shop_order_item_variant_orderId_shop_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."shop_orders"("id") ON DELETE cascade ON UPDATE no action;