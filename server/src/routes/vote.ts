import { describeRoute, validator as zValidator } from "hono-openapi";
import db from "@server/db";
import { projects, projectShips } from "@server/db/schema/main";
import { projectStats, ratings, userStats, votingRoundProjects, votingRounds } from "@server/db/schema/voting";
import { balanceCategories, calculatePayout, SIGMA_TRESHOLD, STAR_BUDGET, weightedSample } from "@server/voting";
import { and, desc, eq, isNull, notInArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { ActiveRoundResponseSchema, AlreadyExistingSessionResponseSchema, NewVoteRoundResponseSchema, ProjectRatingsResponseSchema, PublishVoteRequestSchema } from "@shared/validation"
import { uniqueEntriesEqual } from "@server/lib/arr";
import { rating, rate, ordinal } from "openskill"
import { bumpStatus } from "@server/lib/ships";
import { rankingsRoute } from "./rankings";
import { requestFraudReview } from "@server/lib/joe";
import type { Env } from "..";
import { getCurrentShipTime } from "@server/db/helpers/time";
import { baseResponse, internalServerError, successResponse, singleMessageSchema, unauthorizedError, notFoundError, messageResponse, missingPermissionsError } from "@server/lib/responses";
import z from "zod";
import { notifyVotingFinished } from "@server/lib/notify";
import { users } from "@server/db/schema";
import { HTTPException } from "hono/http-exception";

const CANDIDATE_POOL_SIZE = 50;
export const VOTES_FOR_PAYOUT_PER_SHIP = 10;

export const voteRoute = new Hono<Env>()
	// get session w/ matches
	.post(
		"/rounds",
		describeRoute({
			responses: {
				401: unauthorizedError,
				400: baseResponse("Bad request", z.union([
					singleMessageSchema("There are currently not enough projects to vote on!"),
					AlreadyExistingSessionResponseSchema
				])),
				500: internalServerError,
				201: successResponse(NewVoteRoundResponseSchema)

			}
		}),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const [existing] = await db.select().from(votingRounds).where(and(
				eq(votingRounds.voterId, user.id),
				isNull(votingRounds.completedAt)
			))
			if (existing) {
				return c.json({ message: "A session already exists", existing }, 400)
			}

			const ownProjects = await db.select({ projectId: projects.id }).from(projects).where(eq(projects.creatorId, user.id))

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
				const [round] = await tx.insert(votingRounds).values({ voterId: user.id }).returning()
				if (!round) {
					logger.error({ userId: user.id }, "Couldnt create voting round")
					throw new HTTPException(500, { message: "Something went wrong" })
				}

				const roundProjects = await tx
					.insert(votingRoundProjects)
					.values(pickedCandidates.map((c, i) => ({ projectId: c.projectId, position: i + 1, roundId: round.id })))
					.returning()

				return { round, roundProjects }
			})

			type ProjectDetails = typeof projects.$inferSelect & { position: number, timeSpent: number }
			let projectDetails: ProjectDetails[] = []
			for (const project of roundProjects) {
				const time = await getCurrentShipTime(project.projectId, db, { logger })
				if (!time.ok) {
					return c.json({ message: "Something went wrong" }, 500)
				}

				const [details] = await db.select().from(projects).where(eq(projects.id, project.projectId))
				if (!details) {
					logger.error({ projectId: project.projectId }, "Project of round projects could not be found")
					return c.json({ message: "Something went wrong" }, 500)
				}

				projectDetails.push({ ...details, position: project.position, timeSpent: time.data })
			}


			return c.json({
				round, projects: projectDetails
			}, 201)
		})
	// post your voted results
	.post(
		"/rounds/:id/rate",
		describeRoute({
			responses: {
				200: messageResponse("Success", ["Voted successfully"]),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				400: messageResponse("Bad request", ["Round is already finished", "Invalid projects", "Too many stars used", "Round already finished"]),
				500: internalServerError,
			}
		}),
		zValidator("json", PublishVoteRequestSchema),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const { id } = c.req.param()
			const data = c.req.valid("json")

			const [current] = await db
				.select()
				.from(votingRounds)
				.where(eq(votingRounds.id, id))
			if (!current) {
				return c.json({ message: "Resource not found" }, 404)
			} else if (current.completedAt != null) {
				return c.json({ message: "Round is already finished" }, 400)
			} else if (current.voterId !== user.id) {
				return c.json({ message: "Forbidden" }, 403)
			}

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

			class RoundAlreadyFinishedError extends Error {
				constructor() {
					super("Round already finished");
					this.name = "RoundAlreadyFinishedError";
					Object.setPrototypeOf(this, RoundAlreadyFinishedError.prototype);
				}
			}

			type Finished = { projectId: string, shipId: string, ordinal: number, payout: number }
			const finished = await db.transaction(async (tx) => {
				const [claimed] = await tx
					.update(votingRounds)
					.set({ completedAt: new Date() })
					.where(and(
						eq(votingRounds.id, current.id),
						eq(votingRounds.voterId, user.id),
						isNull(votingRounds.completedAt)
					))
					.returning({ id: votingRounds.id })
				if (!claimed) {
					throw new HTTPException(400, { message: "Round already finished" })
				}


				await tx.insert(ratings).values(data.ratings.map((c) => ({ ...c, roundId: current.id })))
				await tx.update(userStats).set({ votesCast: sql`${userStats.votesCast} + 1` }).where(eq(userStats.userId, user.id))


				const done: Finished[] = []
				for (const [i, r] of data.ratings.entries()) {
					const updated = updatedTeams[i]![0]!
					const updatedOrdinal = ordinal(updated)

					await tx.update(projectStats)
						.set({
							mu: updated.mu,
							sigma: updated.sigma,
							ordinal: updatedOrdinal,
							matchups: sql`${projectStats.matchups} + 1`
						})
						.where(eq(projectStats.projectId, r.projectId))

					if (updated.sigma < SIGMA_TRESHOLD) {
						const [ship] = await tx
							.select({ id: projectShips.id })
							.from(projectShips)
							.where(and(
								eq(projectShips.projectId, r.projectId),
								eq(projectShips.state, "voting")
							))
							.orderBy(desc(projectShips.createdAt))
							.limit(1)
						if (!ship) {
							logger.error({ projectId: r.projectId }, "Could not find ship finishing vote round")
							throw new HTTPException(500, { message: "Something went wrong" })
						}

						const timeRes = await getCurrentShipTime(r.projectId, tx, { logger })
						if (!timeRes.ok) {
							logger.error({ projectId: r.projectId, shipId: ship.id, timeResError: timeRes.error }, "Could not get current ship time")
							throw new HTTPException(500, { message: "Something went wrong" })
						}

						const payout = calculatePayout(updatedOrdinal, 0, timeRes.data)
						await tx
							.update(projectShips)
							.set({
								state: bumpStatus("voting"),
								payout
							})
							.where(eq(projectShips.id, ship.id))
						done.push({ shipId: ship.id, projectId: r.projectId, payout, ordinal: updatedOrdinal })
					}
				}
				return done
			})
			for (const f of finished) {
				const res = await requestFraudReview(f.shipId, f.projectId, db)
				if (!res.ok) {
					logger.error({ projectId: f.projectId, shipId: f.shipId }, "fraud review request failed; ship might go stale")
					return c.json({ message: "Something went wrong" }, 500)
				}

				const [creator] = await db
					.select({ id: users.id, slackId: users.slackId, projectName: projects.name })
					.from(users)
					.innerJoin(projects, eq(projects.id, f.projectId))
					.where(eq(users.id, projects.creatorId))
				if (!creator) {
					logger.warn({ roundId: id, shipId: f.shipId, projectId: f.projectId }, "creator of voting finished project does not exist")
				} else {
					const nRes = await notifyVotingFinished({
						slackUserId: creator.slackId,
						projectId: f.projectId,
						projectName: creator.projectName,
						rating: String(f.ordinal),
						payout: f.payout
					})
					if (!nRes.ok) {
						logger.warn({ roundId: id, shipId: f.shipId, projectId: f.projectId, creatorId: creator.id, res }, "notification voting finished failed")
					}
				}
			}
			return c.json({ message: "Voted successfully" }, 200)
		})
	//get current session
	.get(
		"/rounds/active",
		describeRoute({
			responses: {
				401: unauthorizedError,
				404: notFoundError,
				500: internalServerError,
				200: successResponse(ActiveRoundResponseSchema)
			}
		}),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const [round] = await db.select().from(votingRounds).where(and(
				eq(votingRounds.voterId, user.id),
				isNull(votingRounds.completedAt)
			))
			if (!round) {
				return c.json({ message: "Resource not found" }, 404)
			}
			const roundProjects = await db.select().from(votingRoundProjects).where(eq(votingRoundProjects.roundId, round.id))
			if (roundProjects.length < 4) {
				logger.error({ roundProjects, round }, "Less than 4 projects attached to vote round")
				return c.json({ message: "Something went wrong" }, 500)
			}

			type ProjectDetails = typeof projects.$inferSelect & { position: number, timeSpent: number }
			let projectDetails: ProjectDetails[] = []
			for (const project of roundProjects) {
				const time = await getCurrentShipTime(project.projectId, db, { logger })
				if (!time.ok) {
					return c.json({ message: "Something went wrong" }, 500)
				}

				const [details] = await db.select().from(projects).where(eq(projects.id, project.projectId))
				if (!details) {
					logger.error({ projectId: project.projectId }, "Project of round projects could not be found")
					return c.json({ message: "Something went wrong" }, 500)
				}

				projectDetails.push({ ...details, position: project.position, timeSpent: time.data })
			}

			if (projectDetails.length < 4) {
				logger.error({ roundProjects, round, projectDetails }, "Less than 4 project details found")
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({
				round, projects: projectDetails
			}, 200)
		})
	.route("/rankings", rankingsRoute)

export const projectRatingsRoute = new Hono<Env>()
	.get(
		"/",
		describeRoute({
			responses: {
				400: messageResponse("Bad request"),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				200: successResponse(ProjectRatingsResponseSchema)
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)


			const id = c.req.param("id")
			if (!id) {
				return c.json({ message: "Bad request" }, 400)
			}


			const [proj] = await db.select().from(projects).where(eq(projects.id, id))
			if (!proj) {
				return c.json({ message: "Resource not found" }, 404)
			} else if (proj.creatorId != user.id && user.type != "admin") {
				return c.json({ message: "Forbidden" }, 403)
			}

			const r = await db.select().from(ratings).where(eq(ratings.projectId, proj.id))

			return c.json({ ratings: r }, 200)
		})
