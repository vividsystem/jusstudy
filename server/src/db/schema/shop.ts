import { relations } from "drizzle-orm"
import { boolean, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { addresses } from "./main"
import { users } from "./auth"


export const shopRegions = pgTable("shop_regions", {
	id: uuid().defaultRandom().primaryKey(),
	name: text().notNull()
})

export const shopItems = pgTable("shop_items", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	image: text(),
})

export const regionalItemAvailabilities = pgTable("shop_item_regional_availabilities", {
	itemId: uuid().references(() => shopItems.id).notNull(),
	regionId: uuid().references(() => shopRegions.id).notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	available: boolean().default(false).notNull(),
	quantity: integer(), // null means unlimited
	price: integer().notNull()
}, (table) => [
	primaryKey({ columns: [table.itemId, table.regionId] })
])

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
})

export const itemVariantRelations = relations(itemVariants, ({ many }) => ({
	availabilities: many(regionalItemVariantAvailabilities)
}))

export const regionalItemVariantAvailabilities = pgTable("shop_item_variant_regional_availabilities", {
	variantId: uuid().references(() => itemVariants.id),
	regionId: uuid().references(() => shopRegions.id),
	price: integer().notNull()
}, (table) => [
	primaryKey({ columns: [table.variantId, table.regionId] })
])

export const shopItemRelations = relations(shopItems, ({ many }) => ({
	availabilities: many(regionalItemAvailabilities),
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
	price: integer().notNull(),
	trackingId: text(),
	orderNotes: text(),
	userId: text().references(() => users.id).notNull()
})

export const orderVariantSelection = pgTable("shop_order_item_variant", {
	orderId: uuid().references(() => shopOrders.id, { onDelete: "cascade" }).notNull(),
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
