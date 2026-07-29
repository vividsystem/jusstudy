import { relations } from "drizzle-orm"
import { integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { addresses } from "./main"
import { users } from "./auth"

export const shopItems = pgTable("shop_items", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	quantity: integer(), // null means unlimited
	name: text().notNull(),
	description: text().notNull(),
	basePrice: integer().notNull(),
	image: text(),
})

export const shopItemOptions = pgTable("shop_item_options", {
	id: uuid().defaultRandom().primaryKey(),
	itemId: uuid().references(() => shopItems.id).notNull(),
	name: text().notNull()
})
export const shopItemOptionsRelations = relations(shopItemOptions, ({ many }) => ({
	variants: many(itemVariants)
}))


export const itemVariants = pgTable("shop_item_variants", {
	id: uuid().defaultRandom().primaryKey(),
	optionId: uuid().references(() => shopItemOptions.id).notNull(),
	name: text().notNull(),
	additionalPrice: integer().default(0).notNull()
})

export const shopItemRelations = relations(shopItems, ({ many }) => ({
	orders: many(shopOrders),
	options: many(shopItemOptions)
}))

export const shopOrders = pgTable("shop_orders", {
	id: uuid().defaultRandom().primaryKey(),
	placedAt: timestamp().defaultNow().notNull(),
	fulfilledAt: timestamp(),
	itemId: uuid().references(() => shopItems.id).notNull(),
	quantity: integer().notNull(),
	addressId: uuid().references(() => addresses.id).notNull(), // address also contains buyer id
	trackingId: text(),
	orderNotes: text(),
	userId: text().references(() => users.id).notNull()
})

export const orderVariantSelection = pgTable("shop_order_item_variant", {
	orderId: uuid().references(() => shopOrders.id).notNull(),
	variantId: uuid().references(() => itemVariants.id).notNull()
}, (table) => [
	primaryKey({ columns: [table.orderId, table.variantId] })
])

export const shopOrderRelations = relations(shopOrders, ({ one }) => ({
	item: one(shopItems, {
		fields: [shopOrders.itemId],
		references: [shopItems.id]
	}),
	address: one(addresses, {
		fields: [shopOrders.addressId],
		references: [addresses.id]
	}),
	user: one(users, {
		fields: [shopOrders.userId],
		references: [users.id]
	})
}))
