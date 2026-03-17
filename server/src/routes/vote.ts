import { zValidator } from "@hono/zod-validator";
import type { auth } from "@server/auth";
import db from "@server/db";
import { projects, projectShips } from "@server/db/schema/main";
import { projectStats, ratings, votingRoundProjects, votingRounds } from "@server/db/schema/voting";
import { balanceCategories, SIGMA_TRESHOLD, STAR_BUDGET, weightedSample } from "@server/voting";
import { and, desc, eq, getTableColumns, inArray, isNull, ne, notInArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { publishVoteSchema } from "@shared/validation/votes"
import { uniqueEntriesEqual } from "@server/lib/arr";
import { rating, rate, ordinal } from "openskill"
import { bumpStatus } from "@server/lib/ships";
import { users } from "@server/db/schema";
import { rankingsRoute } from "./rankings";

const CANDIDATE_POOL_SIZE = 50;

export const voteRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	// get session w/ matches
	.post("/rounds", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const existing = await db.select().from(votingRounds).where(and(
			eq(votingRounds.voterId, user.id),
			isNull(votingRounds.completedAt)
		))
		if (existing.length > 0) {
			return c.json({ message: "A session already exists", existing: existing[0]! }, 400)
		}

		const ownProjects = await db.select({ projectId: projects.id }).from(projects).where(eq(projects.creatorId, user.id))
		// get candidates that haven't been looked at by the user/are owned by the user
		const candidates = await db
			.select({
				projectId: projectStats.projectId,
				sigma: projectStats.sigma
			})
			.from(projectStats)
			.innerJoin(projectShips, and(
				eq(projectShips.projectId, projectStats.projectId),
				eq(projectShips.state, "voting"),
			))
			.where(and(
				// isNull(votingRoundProjects.projectId),
				notInArray(projectStats.projectId, ownProjects.map(p => p.projectId)),
			))
			.orderBy(desc(projectStats.sigma))
			.limit(CANDIDATE_POOL_SIZE);


		if (candidates.length < 4) {
			return c.json({ message: "There are currently not enough projects to vote on!" }, 400)
		}

		// picks at random with high sigma being more likely
		const pickedCandidates = weightedSample(candidates, 4)

		const { round, roundProjects } = await db.transaction(async (tx) => {
			const roundRes = await tx.insert(votingRounds).values({ voterId: user.id }).returning()
			if (roundRes.length == 0) {
				throw new Error("inserting votingRound returned nothing")
			}
			const round = roundRes[0]!


			const roundProjects = await tx.insert(votingRoundProjects).values(pickedCandidates.map((c, i) => ({ projectId: c.projectId, position: i + 1, roundId: round.id }))).returning()

			return { round, roundProjects }
		})

		const projectDetails = await db.select().from(projects).innerJoin(projectShips, and(
			eq(projectShips.projectId, projects.id),
			eq(projectShips.state, "voting")
		)).where(inArray(projects.id, roundProjects.map(c => c.projectId)))


		if (projectDetails.length < 4) {
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({
			round, projects: projectDetails.map(s => ({
				...s.projects,
				timeSpent: s.project_ship.timeSpent,
				loggedTime: s.project_ship.loggedTime,
				position: roundProjects.find(p => p.projectId == s.projects.id)!.position
			}))
		}, 201)
	})
	// post your voted results
	.post("/rounds/:id/rate", zValidator("json", publishVoteSchema), async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const { id } = c.req.param()
		const data = c.req.valid("json")

		const currentRound = await db
			.select()
			.from(votingRounds)
			.where(eq(votingRounds.id, id))
		if (currentRound.length == 0) {
			return c.json({ message: "Round not found" }, 404)
		} else if (currentRound[0]!.completedAt != null) {
			return c.json({ message: "Round is already finished" }, 400)
		}

		const current = currentRound[0]!

		const roundsProjects = await db
			.select()
			.from(votingRoundProjects)
			.innerJoin(projectStats, eq(projectStats.projectId, votingRoundProjects.projectId))
			.where(eq(votingRoundProjects.roundId, current.id))

		const projectStatsMap = new Map(roundsProjects.map(p => [p.project_stats.projectId, p.project_stats]))

		const equal = uniqueEntriesEqual(roundsProjects.map(rp => rp.voting_round_projects.projectId), data.ratings.map(rt => rt.projectId))
		if (!equal) {
			return c.json({ message: "Invalid projects" }, 400)
		}

		// check total star number used (individual stars checked using zod)
		const nStars = data.ratings.reduce((acc, cur) => (acc + cur.creativity + cur.technicality + cur.documentation + cur.implementation), 0)
		if (nStars > STAR_BUDGET) {
			return c.json({ message: "Too many stars used" }, 400)
		}

		// get "teams" or pairs of mu/sigma
		const teams = data.ratings.map(r => [
			rating({ mu: projectStatsMap.get(r.projectId)!.mu, sigma: projectStatsMap.get(r.projectId)!.sigma })
		])

		const scores = data.ratings.map(r =>
			balanceCategories(r.technicality, r.documentation, r.creativity, r.implementation)
		)

		const updatedTeams = rate(teams, { score: scores })

		await db.transaction(async (tx) => {
			await tx.update(votingRounds).set({ completedAt: new Date() }).where(eq(votingRounds.id, current.id))
			await tx.insert(ratings).values(data.ratings.map((c) => ({ ...c, roundId: current.id })))

			await Promise.all(
				data.ratings.map(async (r, i) => {
					const updated = updatedTeams[i]![0]!
					if (updated.sigma < SIGMA_TRESHOLD) {
						await tx.update(projectShips).set({ state: bumpStatus("voting") }).where(eq(projectShips.projectId, r.projectId))
					}
					await tx.update(projectStats)
						.set({ mu: updated.mu, sigma: updated.sigma, ordinal: ordinal(updated), matchups: sql`${projectStats.matchups} + 1` })
						.where(eq(projectStats.projectId, r.projectId))
				})
			)
		})

		return c.json({ message: "Voted successfully" }, 200)
	})
	//get current session
	.get("/rounds/active", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const existing = await db.select().from(votingRounds).where(and(
			eq(votingRounds.voterId, user.id),
			isNull(votingRounds.completedAt)
		))
		if (existing.length == 0) {
			return c.json({ message: "Not found" }, 404)
		}
		const round = existing[0]!
		const roundProjects = await db.select().from(votingRoundProjects).where(eq(votingRoundProjects.roundId, round.id))
		if (roundProjects.length < 4) {
			return c.json({ message: "Something wen't wrong" }, 500)
		}

		const projectDetails = await db.select().from(projects).innerJoin(projectShips, and(
			eq(projectShips.projectId, projects.id),
			eq(projectShips.state, "voting")
		)).where(inArray(projects.id, roundProjects.map(c => c.projectId)))


		if (projectDetails.length < 4) {
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({
			round, projects: projectDetails.map(s => ({
				...s.projects,
				timeSpent: s.project_ship.timeSpent,
				loggedTime: s.project_ship.loggedTime,
				position: roundProjects.find(p => p.projectId == s.projects.id)!.position
			}))
		}, 200)
	})
	.route("/rankings", rankingsRoute)
