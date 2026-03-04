import { pgTable, uuid, integer, text, timestamp, real, primaryKey, check, boolean } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { projects } from "./main"
import { relations, sql } from "drizzle-orm"

//hard-code number of allowed stars?
export const votingRounds = pgTable("voting_rounds", {
	id: uuid().defaultRandom().primaryKey(),
	createdAt: timestamp().defaultNow().notNull(),
	completedAt: timestamp(),
	voterId: text().references(() => users.id).notNull()
})

export const votingRoundProjects = pgTable("voting_round_projects", {
	roundId: uuid().references(() => votingRounds.id).notNull(),
	projectId: uuid().references(() => projects.id).notNull(),
	position: integer().notNull() // display order -> maybe a bias?
}, (t) => [
	primaryKey({ columns: [t.roundId, t.projectId] }),
	check("position_range", sql`${t.position} BETWEEN 1 AND 4`),
])

export const ratings = pgTable("ratings", {
	createdAt: timestamp().defaultNow().notNull(),
	roundId: uuid().references(() => votingRounds.id).notNull(),
	projectId: uuid().references(() => projects.id).notNull(),
	technicality: integer().notNull().default(0),
	documentation: integer().notNull().default(0),
	creativity: integer().notNull().default(0),
	implementation: integer().notNull().default(0),
}, (t) => [
	primaryKey({ columns: [t.roundId, t.projectId] })
	//maybe add a rating category >= 0 check in the future?
])


export const votingRoundRelations = relations(votingRounds, ({ one, many }) => ({
	voter: one(users, { fields: [votingRounds.voterId], references: [users.id] }),
	roundProjects: many(votingRoundProjects),
	ratings: many(ratings),
}));

export const votingRoundProjectRelations = relations(votingRoundProjects, ({ one }) => ({
	round: one(votingRounds, { fields: [votingRoundProjects.roundId], references: [votingRounds.id] }),
	project: one(projects, { fields: [votingRoundProjects.projectId], references: [projects.id] }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
	group: one(votingRounds, { fields: [ratings.roundId], references: [votingRounds.id] }),
	project: one(projects, { fields: [ratings.projectId], references: [projects.id] }),
}));

export const projectStats = pgTable("project_stats", {
	projectId: uuid().references(() => projects.id, { onDelete: "cascade" }).primaryKey(),

	// long-term rating -> permanent/no ship reset
	mu: real("mu").notNull().default(25),
	// confidence -> resets per ship
	// used to determine if ships need more votes
	isSettled: boolean().default(false).notNull(), // stats above SIGMA_TRESHOLD
	sigma: real("sigma").notNull().default(8.333),
	ordinal: real("ordinal").notNull().default(0),
	matchups: integer().notNull().default(0),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

