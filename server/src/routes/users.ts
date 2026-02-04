import { zValidator } from "@hono/zod-validator";
import type { auth } from "@server/auth";
import db from "@server/db";
import { addresses, hackatimeProjectLinks, projects } from "@server/db/schema";
import hackatime from "@server/hackatime";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { NewAddressSchema } from "@shared/validation/addresses"

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
	.post("/addresses", zValidator("json", NewAddressSchema), async (c) => {
		const user = c.get("user")

		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const data = c.req.valid("json")

		const res = await db.insert(addresses).values({
			...data,
			userId: user.id
		}).returning()
		if (res.length == 0) {
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ address: res[0]! }, 201)
	})
	.get("/addresses", async (c) => {
		const user = c.get("user")

		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const res = await db.select().from(addresses).where(eq(addresses.userId, user.id))

		return c.json({ addresses: res }, 200)
	})
