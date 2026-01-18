import type { auth } from "@server/auth";
import db from "@server/db";
import { hackatimeProjectLinks, projects } from "@server/db/schema";
import hackatime from "@server/hackatime";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

export const usersRoutes = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.get("/hackatime-projects", async (c) => {
		const user = c.get("user")

		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const res = await hackatime.userProjectDetails(user.slackId, {
			startDate: new Date(process.env.START_DATE!),
		})

		if (!res.success) {
			console.log(res.error)
			return c.json({ message: "Something went wrong" }, 500)
		}

		const dbRes = await db.select({
			hackatimeProjects: hackatimeProjectLinks.hackatimeProjectId
		}).from(hackatimeProjectLinks).leftJoin(projects, and(
			eq(hackatimeProjectLinks.projectId, projects.id),
			eq(projects.creatorId, user.id)
		))

		const alreadyInUse = dbRes.map(p => p.hackatimeProjects)

		return c.json({
			used: alreadyInUse,
			unused: res.projects.filter(p => !alreadyInUse.includes(p.name)).map(p => p.name),
		}, 200)

	})
