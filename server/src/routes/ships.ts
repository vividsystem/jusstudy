import type { auth } from "@server/auth";
import db from "@server/db";
import { devlogs, hackatimeProjectLinks, projects, projectShips, projectStats } from "@server/db/schema";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { Hono } from "hono";
import { shipReviewsRoute } from "./reviews";
import { singleProjectTime } from "@server/hackatime/client";


export const shipsRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.get("/:id", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")

		const res = await db.select({
			ship: getTableColumns(projectShips),
			creatorId: projects.creatorId
		}).from(projectShips).where(eq(projectShips.id, id)).leftJoin(projects, eq(projects.id, projectShips.projectId))
		if (res.length == 0) {
			return c.json({ message: "Ship not found" }, 404)
		} else if (res[0]!.creatorId == null) {
			return c.json({ message: "Something went wrong" }, 500)
		} else if (res[0]!.creatorId != user.id && user.type == "participant") {
			return c.json({ message: "Forbidden" }, 403)
		}


		return c.json({ ship: res[0]!.ship }, 200)

	})
	.route("/:id/reviews", shipReviewsRoute)



export const projectShipRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.post("/", async (c) => {
		const user = c.get("user")
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
