import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./schema-auth";


export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().primaryKey(),
	userId: text().notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
	hackatime_uid: text().notNull().unique(),
	slack_uid: text().notNull().unique(),
})

export const projects = pgTable("projects", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	name: text().notNull(),
	description: text(),
	demoLink: text(),
	repository: text(),
	readmeLink: text(),
	creatorId: uuid().references(() => profiles.id, { onDelete: "cascade" }).notNull()
})

export const hackatimeProjectLinks = pgTable("hackatime_project_links", {
	projectId: uuid().references(() => projects.id, { onDelete: "cascade" }).notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	hackatimeProjectId: text().unique().notNull()
})


export const devlogs = pgTable("project_devlogs", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	projectId: uuid().references(() => projects.id, { onDelete: "cascade" }).notNull(),
	content: text().notNull(),
	attachment: text()
})

export * from "@server/db/schema-auth"
