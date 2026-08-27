import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects, projectShips } from "./main";
import { users } from "./auth";

export const entryTypes = ["devlog", "manual", "htlink"] as const
export const timeEntryTypes = pgEnum("entry_types", entryTypes)

export const timeEntries = pgTable("time_entries", {
	id: uuid().defaultRandom().primaryKey(),
	projectId: uuid().references(() => projects.id).notNull(),
	duration: integer().notNull(),
	timeAnchor: integer().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	createdBy: text().references(() => users.id).notNull(),
	type: timeEntryTypes().notNull(),
})

export const timeCorrections = pgTable("time_corrections", {
	timeEntryId: uuid().references(() => timeEntries.id).primaryKey(),
	reason: text().notNull()
})

export const timeShipSnapshots = pgTable("time_ship_snapshots", {
	timeEntryId: uuid().references(() => timeEntries.id).primaryKey(),
	shipId: uuid().references(() => projectShips.id),
	// shipState: shipStatus().notNull()
})

export const timeHackatimeLinks = pgTable("time_hackatime_links", {
	timeEntryId: uuid().references(() => timeEntries.id).primaryKey(),
	hackatimeProjectName: text().notNull(),
	link: boolean().notNull(),
	projectId: uuid().references(() => projects.id).notNull() // this probably isn't optimal but should make queries way easier
})
