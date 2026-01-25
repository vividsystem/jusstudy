import { zValidator } from "@hono/zod-validator";
import type { auth } from "@server/auth";
import db from "@server/db";
import { devlogs, hackatimeProjectLinks, projects } from "@server/db/schema";
import hackatime from "@server/hackatime";
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

		const stats = await hackatime.userProjectDetails(user.slackId)
		if (!stats.success) {
			return c.json({ message: "Hackatime fetching went wrong" }, 500)
		}

		const links = await db.select().from(hackatimeProjectLinks).where(eq(hackatimeProjectLinks.projectId, projectId))

		const linksArray = links.map(l => l.hackatimeProjectId)

		let newTotalTime = 0
		stats.projects.filter(p => linksArray.includes(p.name)).forEach(p => {
			newTotalTime += p.total_seconds
		})

		if (newTotalTime <= offsetTime) {
			return c.json({ message: "No time that could be logged" }, 400)
		}

		const diffTotalTime = (newTotalTime - offsetTime)



		const res = await db.insert(devlogs).values({
			...data,
			projectId: projectId,
			totalTimeSpent: newTotalTime,
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

		const res = await db.select().from(devlogs).where(eq(devlogs.projectId, projectId))


		return c.json({
			devlogs: res
		}, 200)

	})
// TODO: get all devlogs of project
// TOOD: get one
