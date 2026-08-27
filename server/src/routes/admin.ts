import db from "@server/db";
import { projectShips } from "@server/db/schema";
import { avg, count, max, min, sum } from "drizzle-orm";
import { Hono } from "hono";
import type { Env } from ".."
import { describeRoute, resolver } from "hono-openapi";
import { adminStatsSchema } from "@shared/validation/admin"
import { internalServerError, unauthorizedError, missingPermissionsError } from "@server/lib/responses";

export const adminRoute = new Hono<Env>()
	.get(
		"/stats",
		describeRoute({
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							schema: resolver(adminStatsSchema)
						}
					}
				},
				401: unauthorizedError,
				403: missingPermissionsError,
				500: internalServerError
			}
		}),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")

			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

			const shipStatsRes = await db.select({
				payoutsGiven: sum(projectShips.payout).mapWith(Number),
				shipsMade: count(),
				minPayout: min(projectShips.payout).mapWith(Number),
				maxPayout: max(projectShips.payout).mapWith(Number),
				avgPayout: avg(projectShips.payout).mapWith(Number),
			}).from(projectShips)
			if (shipStatsRes.length == 0) {
				logger.error("Admin stats not working!")
				return c.json({ message: "Something went wrong" }, 500)
			}
			const reviewStats = await db.select({ n: count(), state: projectShips.state }).from(projectShips).groupBy(projectShips.state)
			if (reviewStats.length === 0) {
				logger.error("Cannot get ship stats")
				return c.json({ message: "Something went wrong " }, 500)
			}


			return c.json({
				...shipStatsRes,
				finishedShips: reviewStats.find((rs) => rs.state == "finished")?.n || 0,
				failedShips: reviewStats.find((rs) => rs.state == "failed")?.n || 0,
				shipsInVoting: reviewStats.find((rs) => rs.state == "voting")?.n || 0,
				shipsAwaitingNormalReview: reviewStats.find((rs) => rs.state == "pre-initial")?.n || 0,
				shipsAwaitingFraudReview: reviewStats.find((rs) => rs.state == "pre-fraud")?.n || 0,
				shipsAwaitingPayout: reviewStats.find((rs) => rs.state == "pre-payout")?.n || 0,
			}, 200)

		})
