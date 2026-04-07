import { boolean, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { relations } from "drizzle-orm";

export const projectCategoryValues = ["CAD", "Game Development", "Web Development", "PCB Design", "Art", "Music", "App Development", "Desktop App Development"] as const
export const categoryEnum = pgEnum("category", projectCategoryValues)

export type ProjectCategories = typeof categoryEnum.enumValues[number]

export const projects = pgTable("projects", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	name: text().notNull(),
	description: text(),
	demoLink: text(),
	repository: text().notNull(),
	readmeLink: text(),
	category: categoryEnum().notNull(),
	creatorId: text().references(() => users.id, { onDelete: "cascade" }).notNull()
})

export const projectsRelations = relations(projects, ({ many }) => ({
	hackatimeLinks: many(hackatimeProjectLinks),
	devlogs: many(devlogs),
	ships: many(projectShips)
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
})

export const devlogAttachments = pgTable("devlog_attachments", {
	createdAt: timestamp().defaultNow().notNull(),
	spaceFileId: uuid().notNull().primaryKey(), //no auto-gen
	devlogId: uuid().references(() => devlogs.id, { onDelete: "cascade" }).notNull()
})
export const devlogAttachmentsRelations = relations(devlogAttachments, ({ one }) => ({
	devlog: one(devlogs, {
		fields: [devlogAttachments.devlogId],
		references: [devlogs.id]
	})
}))

export const devlogsRelations = relations(devlogs, ({ one, many }) => ({
	project: one(projects, {
		fields: [devlogs.projectId],
		references: [projects.id]
	}),
	attachments: many(devlogAttachments)
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
	quantity: integer(), // null means unlimited
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

export const projectReviews = pgTable("project_reviews", {
	createdAt: timestamp().defaultNow().notNull(),
	passed: boolean().default(false).notNull(),
	shipId: uuid().references(() => projectShips.id, { onDelete: "cascade" }).primaryKey(),
	comment: text().notNull(),
	note: text(),
	reviewerId: text().references(() => users.id).notNull()
})


export const joeFraudReviews = pgTable("joe_fraud_reviews", {
	createdAt: timestamp().defaultNow().notNull(),
	finishedAt: timestamp(),
	shipId: uuid().references(() => projectShips.id, { onDelete: "cascade" }).primaryKey(),
	joeProjectId: uuid().notNull(),
	confidence: integer(),
	passed: boolean()
})

export const projectReviewRelations = relations(projectReviews, ({ one }) => ({
	ship: one(projectShips, {
		fields: [projectReviews.shipId],
		references: [projectShips.id],
	}),
	reviewer: one(users, {
		fields: [projectReviews.reviewerId],
		references: [users.id]
	})
}))


export const shipStatusValues = ["pre-initial", "voting", "pre-fraud", "failed", "pre-payout", "finished"] as const
export const shipStatus = pgEnum("ship_status", shipStatusValues)
export type ProjectShipStatus = typeof shipStatus.enumValues[number]

export const projectShips = pgTable("project_ship", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	timeSpent: integer().notNull(),
	totalTime: integer().notNull(),
	loggedTime: integer().notNull(),
	state: shipStatus().notNull().default("pre-initial").notNull(),
	payout: integer(),
	projectId: uuid().references(() => projects.id, { onDelete: "cascade" }).notNull()
})

export const projectShipRelations = relations(projectShips, ({ one, many }) => ({
	project: one(projects, {
		fields: [projectShips.projectId],
		references: [projects.id]
	}),
	reviews: many(projectReviews)
}))
