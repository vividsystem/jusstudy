import { integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./schema-auth";
import { relations } from "drizzle-orm";

export const projectCategoryValues = ["CAD", "Game Development", "Web Development", "PCB Design", "Art", "Music"] as const
export const categoryEnum = pgEnum("category", projectCategoryValues)

export type ProjectCategories = typeof categoryEnum.enumValues[number]

export const projects = pgTable("projects", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	name: text().notNull(),
	description: text(),
	demoLink: text(),
	repository: text(),
	readmeLink: text(),
	category: categoryEnum().notNull(),
	creatorId: text().references(() => users.id, { onDelete: "cascade" }).notNull()
})

export const projectsRelations = relations(projects, ({ many }) => ({
	hackatimeLinks: many(hackatimeProjectLinks),
	devlogs: many(devlogs)
}));


export const hackatimeProjectLinks = pgTable("hackatime_project_links", {
	projectId: uuid().references(() => projects.id, { onDelete: "cascade" }).notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	hackatimeProjectId: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.hackatimeProjectId, table.projectId] })
])

export const hackatimeProjectLinksRelations = relations(hackatimeProjectLinks, ({ one }) => ({
	project: one(projects, {
		fields: [hackatimeProjectLinks.projectId],
		references: [projects.id],
	}),
}));


export const devlogs = pgTable("project_devlogs", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	projectId: uuid().references(() => projects.id, { onDelete: "cascade" }).notNull(),
	timeSpent: integer().notNull(), // 0 to 10h per devlog
	totalTimeSpent: integer().notNull(), // total amount of time spent up until that log
	content: text().notNull(),
	attachment: text()
})

export const devlogsRelations = relations(devlogs, ({ one }) => ({
	project: one(projects, {
		fields: [devlogs.projectId],
		references: [projects.id]
	})
}))

export const addresses = pgTable("addresses", {
	id: uuid().defaultRandom().primaryKey(),
	firstname: text().notNull(),
	lastname: text().notNull(),
	address_first_line: text().notNull(),
	address_second_line: text(),
	city: text().notNull(),
	state: text().notNull(),
	postal_code: text().notNull(),
	country: text().notNull(),
	userId: text().references(() => users.id).notNull()

	//telephone number also part in hackclub auth?
})

export const addressesRelations = relations(addresses, ({ one, many }) => ({
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
	orders: many(shopOrders)
}))

export const shopItems = pgTable("shop_items", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	quantity: integer(), // null means unlimited?
	name: text().notNull(),
	description: text().notNull(),
	price: integer().notNull(),
	image: text(),
})

export const shopItemRelations = relations(shopItems, ({ many }) => ({
	orders: many(shopOrders)
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

export * from "@server/db/schema-auth"
