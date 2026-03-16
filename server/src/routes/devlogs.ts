import { zValidator } from "@hono/zod-validator";
import type { auth } from "@server/auth";
import db from "@server/db";
import { devlogs, hackatimeProjectLinks, projects } from "@server/db/schema";
import { singleProjectTime } from "@server/hackatime/client";
import { NewDevlogRequestSchema } from "@shared/validation/devlogs";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";




export const devlogsRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.post("/", zValidator("json", NewDevlogRequestSchema), async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const projectId = c.req.param("id")
		if (!projectId) {
			return c.json({ message: "Bad request" }, 400)
		}
		const data = c.req.valid("json")


		const project = await db.select().from(projects).where(eq(projects.id, projectId!))
		if (project.length == 0) {
			return c.json({ message: "Not found" }, 404)
		}
		if (project[0]?.creatorId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}


		const offsetTimeRes = await db
			.select({ totalTime: devlogs.totalTimeSpent })
			.from(devlogs)
			.where(eq(devlogs.projectId, projectId))
			.orderBy(desc(devlogs.totalTimeSpent))
			.limit(1)
		const offsetTime = offsetTimeRes[0]?.totalTime || 0

		const links = await db.select().from(hackatimeProjectLinks).where(eq(hackatimeProjectLinks.projectId, projectId))

		const stats = await singleProjectTime(user.slackId, links)
		if (!stats.ok) {
			return c.json({ message: "Hackatime fetching went wrong" }, 500)
		}

		if (stats.time <= offsetTime) {
			return c.json({ message: "No time that could be logged" }, 400)
		}

		const diffTotalTime = (stats.time - offsetTime)



		const res = await db.insert(devlogs).values({
			...data,
			projectId: projectId,
			totalTimeSpent: stats.time,
			timeSpent: diffTotalTime < 10 * 3600 ? diffTotalTime : 10 * 3600, // constrain time per log to 10h
		}).returning()
		if (res.length == 0) {
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ devlog: res[0]! }, 201)
	})
	.get("/", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const projectId = c.req.param("id")
		if (!projectId) {
			return c.json({ message: "Bad request" }, 400)
		}

		const res = await db.select().from(devlogs).where(eq(devlogs.projectId, projectId)).orderBy(desc(devlogs.createdAt))


		return c.json({
			devlogs: res
		}, 200)

	})
// TODO: get all devlogs of project
// TOOD: get one
