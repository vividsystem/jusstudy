import { boolean, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { relations } from "drizzle-orm";
import { shopOrders } from "./shop";
import { timeEntries, timeHackatimeLinks, timeShipSnapshots } from "./time";

export const projectCategoryValues = ["CAD", "Game Development", "Web Development", "PCB Design", "App Development", "Desktop App Development"] as const
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
	totalTime: integer().default(0).notNull(), // cache for aggregate sum in time entries
	creatorId: text().references(() => users.id, { onDelete: "cascade" }).notNull()
})

export const projectsRelations = relations(projects, ({ many }) => ({
	devlogs: many(devlogs),
	ships: many(projectShips),
	timeEntries: many(timeEntries),
	hackatimeLinks: many(timeHackatimeLinks)
}));


export const devlogs = pgTable("project_devlogs", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	projectId: uuid().references(() => projects.id, { onDelete: "cascade" }).notNull(),
	timeEntryId: uuid().references(() => timeEntries.id).notNull(),
	content: text().notNull(),
})

export const devlogAttachments = pgTable("devlog_attachments", {
	createdAt: timestamp().defaultNow().notNull(),
	cdnURL: text().primaryKey(), //no auto-gen
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


export const projectLocks = pgTable("project_locks", {
	projectId: uuid().references(() => projects.id).notNull(),
	shipId: uuid().references(() => projectShips.id).notNull(),
	lockedAt: timestamp().defaultNow().notNull(),
	unlockedAt: timestamp(),
}, (table) => [
	primaryKey({ columns: [table.projectId, table.shipId] })
])

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

export const projectShips = pgTable("project_ships", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	state: shipStatus().notNull().default("pre-initial").notNull(),
	payout: integer(),
	projectId: uuid().references(() => projects.id, { onDelete: "cascade" }).notNull()
})

export const projectShipRelations = relations(projectShips, ({ one, many }) => ({
	project: one(projects, {
		fields: [projectShips.projectId],
		references: [projects.id]
	}),
	reviews: many(projectReviews),
	timeSnapshots: many(timeShipSnapshots)
}))
