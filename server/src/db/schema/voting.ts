import { pgTable, uuid, integer, text, timestamp, real, primaryKey, check } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { projects, projectShips } from "./main"
import { relations, sql } from "drizzle-orm"

//hard-code number of allowed stars?
export const votingSessions = pgTable("voting_sessions", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	completedAt: timestamp(),
	voterId: text().references(() => users.id).notNull(),
})

export const votingGroups = pgTable("voting_groups", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	sessionId: uuid().references(() => votingSessions.id).notNull(),
})

export const votingGroupShips = pgTable("voting_group_ships", {
	groupId: uuid().references(() => votingGroups.id).notNull(),
	shipId: uuid().references(() => projectShips.id).notNull(),
	position: integer().notNull() // display order -> maybe a bias?
}, (t) => [
	primaryKey({ columns: [t.groupId, t.shipId] }),
	check("position_range", sql`${t.position} BETWEEN 1 AND 4`),
])

export const ratings = pgTable("ratings", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp().defaultNow().notNull(),
	sessionId: uuid().references(() => votingSessions.id).notNull(),
	groupId: uuid().references(() => votingGroups.id).notNull(),
	shipId: uuid().references(() => projectShips.id).notNull(),
	technicality: integer().notNull().default(0),
	documentation: integer().notNull().default(0),
	creativity: integer().notNull().default(0),
	implementation: integer().notNull().default(0),
}, (t) => [
	primaryKey({ columns: [t.sessionId, t.shipId] })
	//maybe add a rating category >= 0 check in the future?
])



export const votingSessionsRelations = relations(votingSessions, ({ one, many }) => ({
	voter: one(users, { fields: [votingSessions.voterId], references: [users.id] }),
	groups: many(votingGroups),
	ratings: many(ratings),
}));

export const votingGroupsRelations = relations(votingGroups, ({ one, many }) => ({
	session: one(votingSessions, { fields: [votingGroups.sessionId], references: [votingSessions.id] }),
	groupProjects: many(votingGroupShips),
	ratings: many(ratings),
}));

export const votingGroupShipsRelations = relations(votingGroupShips, ({ one }) => ({
	group: one(votingGroups, { fields: [votingGroupShips.groupId], references: [votingGroups.id] }),
	ship: one(projectShips, { fields: [votingGroupShips.shipId], references: [projectShips.id] }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
	session: one(votingSessions, { fields: [ratings.sessionId], references: [votingSessions.id] }),
	group: one(votingGroups, { fields: [ratings.groupId], references: [votingGroups.id] }),
	ship: one(projectShips, { fields: [ratings.shipId], references: [projectShips.id] }),
}));

export const projectStats = pgTable("project_stats", {
	projectId: uuid().references(() => projects.id).primaryKey(),

	// long-term rating -> permanent/no ship reset
	mu: real("mu").notNull().default(25),
	// confidence -> resets per ship
	// used to determine if ships need more votes
	sigma: real("sigma").notNull().default(8.333),
	ordinal: real("ordinal").notNull().default(0),
	matchups: integer().notNull().default(0),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

