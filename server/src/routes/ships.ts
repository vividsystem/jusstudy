import db from "@server/db";
import { projectLocks, projects, projectShips, projectStats, timeEntries, timeHackatimeLinks, timeShipSnapshots } from "@server/db/schema";
import { and, desc, eq, getTableColumns, isNull, lt } from "drizzle-orm";
import { Hono } from "hono";
import { shipReviewsRoute } from "./reviews";
import { singleProjectTime } from "@server/hackatime/client";
import type { Env } from "..";
import { auth } from "@server/auth";
import { getShipTime } from "@server/db/helpers/time";
import { internalServerError, messageResponse, missingPermissionsError, notFoundError, successResponse, unauthorizedError } from "@server/lib/responses";
import { describeRoute } from "hono-openapi";
import { NewShipResponseSchema, ProjectShipsResponseSchema, ShipByIdResponseSchema } from "@shared/validation";

export const shipsRoute = new Hono<Env>()
	.get(
		"/:id",
		describeRoute({
			responses: {
				200: successResponse(ShipByIdResponseSchema),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				500: internalServerError
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			const logger = c.get("logger")

			const id = c.req.param("id")

			const [ship] = await db.select({
				ship: getTableColumns(projectShips),
				creatorId: projects.creatorId
			}).from(projectShips)
				.where(eq(projectShips.id, id))
				.innerJoin(projects, eq(projects.id, projectShips.projectId))
			if (!ship) {
				return c.json({ message: "Ressource not found" }, 404)
			} else if (ship.creatorId != user.id && user.type == "participant") {
				return c.json({ message: "Forbidden" }, 403)
			}

			const time = await getShipTime(id, { logger })
			if (!time.ok) {
				logger.error({ ship }, "Could not get time for ship")
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({ ship: { ...ship.ship, timeShipped: time.data } }, 200)
		})
	.route("/:id/reviews", shipReviewsRoute)



export const projectShipRoute = new Hono<Env>()
	.post(
		"/",
		describeRoute({
			responses: {
				200: successResponse(NewShipResponseSchema),
				400: messageResponse("Bad request", ["Bad request", "This project has other unfinished ships"]),
				401: unauthorizedError,
				403: messageResponse("Missing permissions", ["Project locked.", "You need to be YSWS eligible", "Hackatime account needs to be linked!", "You need to have time logged to ship"]),
				404: notFoundError,
				500: internalServerError
			}
		}),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.banned) return c.json({ message: "Forbidden" }, 403)
			if (!user.yswsEligible) return c.json({ message: "You need to be YSWS eligible" }, 403)

			const id = c.req.param("id")
			if (!id) {
				return c.json({ message: "Bad request" }, 400)
			}

			const [project] = await db.select().from(projects).where(eq(projects.id, id))
			if (!project) {
				return c.json({ message: "Ressource not found" }, 404)
			} else if (project.creatorId != user.id) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const [lock] = await db
				.select()
				.from(projectLocks)
				.where(and(
					eq(projectLocks.projectId, id),
					isNull(projectLocks.unlockedAt)
				))
			if (lock) {
				return c.json({ message: "Project locked." }, 403)
			}


			const [lastShip] = await db
				.select()
				.from(projectShips)
				.where(eq(projectShips.projectId, project.id))
				.orderBy(desc(projectShips.createdAt))
				.limit(1)
			if (lastShip && (lastShip.state == "finished" || lastShip.state == "failed")) {
				return c.json({ message: "This project has other unfinished ships" }, 400)
			}

			const links = await db
				.select({ htProjectId: timeHackatimeLinks.hackatimeProjectName })
				.from(timeHackatimeLinks)
				.where(eq(timeHackatimeLinks.projectId, id))

			const accounts = await auth.api.listUserAccounts({ headers: c.req.raw.headers })
			const htAccount = accounts.find((a) => a.providerId === "hackatime")
			if (!htAccount) {
				return c.json({ message: "Hackatime account needs to be linked!" }, 400)
			}

			const token = await auth.api.getAccessToken({
				headers: c.req.raw.headers,
				body: {
					accountId: htAccount.id
				}
			})

			const time = await singleProjectTime(token.accessToken, links.map((l) => l.htProjectId))
			if (!time.ok) {
				logger.error({ project, htAccount, res_status: time.res?.status, res_type: time.res?.headers.get("Content-Type"), res_url: time.res?.url }, time.error)
				return c.json({ message: "Hackatime fetching went wrong" }, 500)
			}


			const [ship] = await db
				.insert(projectShips)
				.values({
					projectId: id,
					state: "pre-initial"
				}).returning()
			if (!ship) {
				logger.error({ time, projectId: id }, "Couldnt create ship")
				return c.json({ message: "Something went wrong" }, 500)
			}
			const [lastEntry] = await db
				.select({ id: timeEntries.id })
				.from(timeEntries)
				.where(and(
					lt(timeEntries.createdAt, ship.createdAt),
					eq(timeEntries.projectId, ship.projectId)))
				.orderBy(desc(timeEntries.createdBy))
				.limit(1)
			if (!lastEntry) {
				return c.json({ message: "You need to have time logged to ship" }, 400)
			}

			await db.insert(timeShipSnapshots).values({
				timeEntryId: lastEntry.id,
				shipId: ship.id
			})

			const pStats = await db.select().from(projectStats).where(eq(projectStats.projectId, id))
			if (pStats.length == 0) {
				await db.insert(projectStats).values({ projectId: id })
			} else {
				//reset uncertainty -> multiplier instead of full-reset doesn't make sense as projects can only be reshipped once already below treshold and would therefore collapse to roughly the same sigma
				await db.update(projectStats).set({ sigma: 25 / 3, ordinal: pStats[0]!.mu - 3 * (25 / 3) }).where(eq(projectStats.projectId, id))
			}


			return c.json({
				ship
			}, 201)
		})
	.get(
		"/",
		describeRoute({
			responses: {
				200: successResponse(ProjectShipsResponseSchema),
				400: messageResponse("Bad request"),
				401: unauthorizedError,
				500: internalServerError
			}
		}),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const id = c.req.param("id")
			if (!id) {
				return c.json({ message: "Bad request" }, 400)
			}

			const ships = await db
				.select()
				.from(projectShips)
				.where(eq(projectShips.projectId, id))
				.orderBy(desc(projectShips.createdAt))


			try {
				return c.json({
					ships: await Promise.all(ships.map(async (s) => {
						const time = await getShipTime(s.id, { logger })
						if (!time.ok) {
							throw new Error(time.error.message)
						}
						return { ...s, timeShipped: time.data }
					}))
				}, 200)
			} catch (e) {
				return c.json({ message: "Something went wrong" }, 500)
			}
		})
	.post(
		"/payout",
		describeRoute({
			responses: {
				400: messageResponse("Currently disabled", ["Currently disabled while we gather data to make payout amounts fair!"]),
				401: unauthorizedError
			}
		}),
		async (c) => {
			const user = c.get("user")
			// const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			return c.json({ message: "Currently disabled while we gather data to make payout amounts fair!" }, 400)
			// const id = c.req.param("id")
			// if (!id) {
			// 	return c.json({ message: "Bad request" }, 400)
			// }
			//
			// const [project] = await db
			// 	.select()
			// 	.from(projects)
			// 	.where(eq(projects.id, id))
			// if (!project) {
			// 	return c.json({ message: "Not found" }, 404)
			// } else if (project.creatorId != user.id) {
			// 	return c.json({ message: "Forbidden" }, 403)
			// }
			//
			// const [lock] = await db
			// 	.select()
			// 	.from(projectLocks)
			// 	.where(and(
			// 		eq(projectLocks.projectId, id),
			// 		isNull(projectLocks.unlockedAt)
			// 	))
			// if (lock) {
			// 	return c.json({ message: "Project locked." }, 403)
			//
			// }
			//
			// const [ship] = await db
			// 	.select()
			// 	.from(projectShips)
			// 	.where(
			// 		and(
			// 			eq(projectShips.projectId, id),
			// 			eq(projectShips.state, "pre-payout")
			// 		)
			// 	)
			// if (!ship) {
			// 	return c.json({ message: "No active pre-payout ships found" }, 404)
			// }
			//
			// const [uStats] = await db.select().from(userStats).where(eq(userStats.userId, user.id))
			// if (!uStats) {
			// 	logger.error({ ship, project }, "Couldnt find user stats")
			// 	return c.json({ message: "Something went wrong" }, 500)
			// }
			//
			// return await db.transaction(async (tx) => {
			// 	const [nRes] = await db
			// 		.select({ nFinishedShips: count() })
			// 		.from(projectShips)
			// 		.innerJoin(projects,
			// 			eq(projects.id, projectShips.projectId))
			// 		.where(and(
			// 			eq(projects.creatorId, user.id),
			// 			eq(projectShips.state, "finished")
			// 		))
			// 	if (!nRes) {
			// 		tx.rollback()
			// 		return c.json({ message: "Bad request" }, 400)
			// 	}
			// 	const REQUIRED_VOTES = (nRes.nFinishedShips + 1) * VOTES_FOR_PAYOUT_PER_SHIP
			// 	if (REQUIRED_VOTES > uStats.votesCast) {
			// 		tx.rollback()
			// 		return c.json({ message: "More votes needed to unlock payment" }, 400)
			// 	}
			//
			//
			// 	const [shipRes] = await db
			// 		.update(projectShips)
			// 		.set({ state: bumpStatus("pre-payout") })
			// 		.where(and(
			// 			eq(projectShips.id, ship.id),
			// 			eq(projectShips.state, "pre-payout")
			// 		)).returning()
			// 	if (!shipRes || !shipRes.payout) {
			// 		tx.rollback()
			// 		return c.json({ message: "Bad request" }, 400)
			// 	}
			//
			// 	await db
			// 		.update(users)
			// 		.set({ coins: sql<number>`${users.coins} + ${shipRes.payout}` })
			// 		.where(eq(users.id, user.id))
			//
			// 	return c.json({ message: "Coins awarded", amount: shipRes.payout }, 201)

		})
