import db from "@server/db";
import { devlogs, hackatimeProjectLinks, projects, projectShips, projectStats } from "@server/db/schema";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { Hono } from "hono";
import { shipReviewsRoute } from "./reviews";
import { singleProjectTime } from "@server/hackatime/client";
import type { Env } from "..";

export const shipsRoute = new Hono<Env>()
	.get("/:id", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")

		const [ship] = await db.select({
			ship: getTableColumns(projectShips),
			creatorId: projects.creatorId
		}).from(projectShips).where(eq(projectShips.id, id)).innerJoin(projects, eq(projects.id, projectShips.projectId))
		if (!ship) {
			return c.json({ message: "Ship not found" }, 404)
		} else if (ship.creatorId != user.id && user.type == "participant") {
			return c.json({ message: "Forbidden" }, 403)
		}


		return c.json({ ship: ship.ship }, 200)

	})
	.route("/:id/reviews", shipReviewsRoute)



export const projectShipRoute = new Hono<Env>()
	.post("/", async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)
		if (user.banned) return c.json({ message: "Forbidden" }, 403)
		if (!user.yswsEligible) return c.json({ message: "You need to be YSWS eligible" }, 403)

		const id = c.req.param("id")
		if (!id) {
			return c.json({ message: "Bad request" }, 400)
		}

		const res = await db.select().from(projects).where(eq(projects.id, id))
		if (res.length == 0) {
			return c.json({ message: "Ressource not found" }, 404)
		}
		const project = res[0]!
		if (project.creatorId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}


		const lastShip = await db
			.select()
			.from(projectShips)
			.where(eq(projectShips.projectId, project.id))
			.orderBy(desc(projectShips.createdAt))
			.limit(1)
		if (lastShip.length > 0 && !(lastShip[0]?.state == "finished" || lastShip[0]?.state == "failed")) {
			return c.json({ message: "This project has other unfinished ships" }, 400)
		}
		const lastDevlog = await db
			.select()
			.from(devlogs)
			.where(eq(devlogs.projectId, project.id))
			.orderBy(desc(devlogs.createdAt))
			.limit(1)


		const timeAlreadyShipped = lastShip[0]?.timeSpent || 0
		const loggedTime = (lastDevlog[0]?.timeSpent || 0) - (lastShip[0]?.loggedTime || 0)


		const links = await db.select().from(hackatimeProjectLinks).where(eq(hackatimeProjectLinks.projectId, id))
		const stats = await singleProjectTime(user.slackId, links)
		if (!stats.ok) {
			return c.json({ message: "Hackatime fetching went wrong" }, 500)
		}

		const timeSpent = stats.time - timeAlreadyShipped
		if (timeSpent <= 0) {
			return c.json({ message: "No new time to be logged" }, 400)
		}

		const ship = await db
			.insert(projectShips)
			.values({
				timeSpent,
				totalTime: stats.time,
				loggedTime,
				projectId: id,
				state: "pre-initial"
			}).returning()
		if (ship.length == 0) {
			logger.error({ stats, projectId: id }, "Couldnt create ship")
			return c.json({ message: "Something went wrong" }, 500)
		}

		const pStats = await db.select().from(projectStats).where(eq(projectStats.projectId, id))
		if (pStats.length == 0) {
			await db.insert(projectStats).values({ projectId: id })
		} else {
			//reset uncertainty -> multiplier instead of full-reset doesn't make sense as projects can only be reshipped once already below treshold and would therefore collapse to roughly the same sigma
			await db.update(projectStats).set({ sigma: 25 / 3, ordinal: pStats[0]!.mu - 3 * (25 / 3) }).where(eq(projectStats.projectId, id))
		}


		return c.json({
			ship: ship[0]!
		}, 201)
	})
	.get("/", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")
		if (!id) {
			return c.json({ message: "Bad request" }, 400)
		}

		const ships = await db.select().from(projectShips).where(eq(projectShips.projectId, id)).orderBy(desc(projectShips.createdAt))

		return c.json({ ships: ships }, 200)
	})
	.post("payout", async (c) => {
		const user = c.get("user")
		// const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		return c.json({ message: "Currently disabled!" }, 400)
		// const id = c.req.param("id")
		// if (!id) {
		// 	return c.json({ message: "Bad request" }, 400)
		// }
		//
		// const projectRes = await db
		// 	.select()
		// 	.from(projects)
		// 	.where(eq(projects.id, id))
		// if (projectRes.length == 0) {
		// 	return c.json({ message: "Not found" }, 404)
		// }
		// const project = projectRes[0]!
		// if (project.creatorId != user.id) {
		// 	return c.json({ message: "Forbidden" }, 403)
		// }
		// const activeShips = await db
		// 	.select()
		// 	.from(projectShips)
		// 	.where(
		// 		and(
		// 			eq(projectShips.projectId, id),
		// 			eq(projectShips.state, "pre-payout")
		// 		)
		// 	)
		// if (activeShips.length == 0) {
		// 	return c.json({ message: "No active pre-payout ships found" }, 404)
		// }
		// const ship = activeShips[0]!
		//
		// const [uStats] = await db.select().from(userStats).where(eq(userStats.userId, user.id))
		// if (!uStats) {
		//  logger.error({ ship, activeShips, project }, "Couldnt find user stats")
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
		//
		// })
	})
