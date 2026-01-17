import type { auth } from "@server/auth";
import db from "@server/db";
import { Hono } from "hono";
import hackatime from "@server/hackatime";
import { hackatimeProjectLinks, projects } from "@server/db/schema";
import { and, eq } from "drizzle-orm";
import { HackatimeLinkRequestSchema, NewProjectRequestSchema } from "@server/validation/projects";


export const projectsRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()

	//get all projects
	.get("/", async (c) => {
		const user = c.get("user")


		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const res = await db.query.projects.findMany({
			where: (projects, { eq }) => eq(projects.creatorId, user.id),
			with: {
				hackatimeLinks: true
			}
		})

		const stats = await hackatime.userStats(user.slackId, {
			startDate: new Date("2026-01-01"),
			features: ["projects"]
		})

		if (!stats.success) {
			console.log(stats.error)
			return c.json({ message: "Something went wrong" }, 500)
		}


		// to calc logged time in the future maybe make an aggregate function to sum up time each devlog
		let timeRecord: Record<string, number> = {}
		for (let project of res) {
			const ids = project.hackatimeLinks.map((l) => l.hackatimeProjectId)

			// sum time spent up
			stats.data.projects!.filter((p) => ids.includes(p.name)).forEach(p => (
				timeRecord[project.id] = timeRecord[project.id] || 0 + p.totalSeconds
			))

		}

		return c.json({
			projects: res.map(p => {
				const { hackatimeLinks, ...rest } = p
				return { ...rest, timeSpent: timeRecord[rest.id] || 0 }
			})
		})
	})


	// get project by id
	.get("/:id", async (c) => {
		//no auth required for now
		// const user = c.get("user")
		// if (!user) return c.json({ message: "Unauthorized" }, 401)
		//
		//
		const id = c.req.param("id")

		const res = await db.select().from(projects).where(eq(projects.id, id))
		if (res.length == 0) {
			return c.json({ message: "Ressource not found" }, 404)
		}

		return c.json({ project: res[0] })
	})


	//create a new project
	.post("/", async (c) => {
		//no auth required for now
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const body = await c.req.json()

		const parsed = NewProjectRequestSchema.safeParse(body)
		if (!parsed.success) {
			return c.json({ message: "Bad request" }, 400)
		}

		// TODO: add auto readmeLink generation

		const res = await db.insert(projects).values({
			...parsed.data,
			creatorId: user.id
		}).returning()
		if (res.length == 0) {
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ message: "Project created", project: res[0] })
	})


const UpdateProjectRequestSchema = NewProjectRequestSchema.partial().strip()
projectsRoute.patch("/:id", async (c) => {
	const user = c.get("user")
	if (!user) return c.json({ message: "Unauthorized" }, 401)

	const id = c.req.param("id")
	const body = await c.req.json()

	const proj = await db
		.select()
		.from(projects)
		.where(eq(projects.id, id))
	if (proj.length == 0) {
		return c.json({ message: "Ressource not found" }, 404)
	}
	const project = proj[0]!
	if (project.creatorId != user.id) {
		return c.json({ message: "Forbidden" }, 403)
	}

	const parsed = UpdateProjectRequestSchema.safeParse(body)
	if (!parsed.success) {
		return c.json({ message: "Bad request" }, 400)
	}

	// TODO: add auto readmeLink generation

	const res = await db
		.update(projects)
		.set({
			...parsed.data,
		})
		.where(eq(projects.id, id))
		.returning()
	if (res.length == 0) {
		return c.json({ message: "Something went wrong" }, 500)
	}

	return c.json({ message: "Project updated", project: res[0] })
})


	//link a hackatime project
	.post("/:id/link", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")

		const res = await db.select().from(projects).where(eq(projects.id, id))
		if (res.length == 0) {
			return c.json({ message: "Ressource not found" }, 404)
		}
		const project = res[0]!
		if (project.creatorId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}

		const body = c.req.json()
		const parsed = HackatimeLinkRequestSchema.safeParse(body)
		if (!parsed.success) {
			return c.json({ message: "Bad request" }, 400)
		}

		const alreadyExisting = await db.select().from(hackatimeProjectLinks).where(and(
			eq(hackatimeProjectLinks.hackatimeProjectId, parsed.data.id),
			eq(hackatimeProjectLinks.creatorId, user.id)
		))
		if (alreadyExisting.length != 0) {
			return c.json({ message: "This hackatime project has already been linked to another project!" }, 400)
		}

		const newLink = await db.insert(hackatimeProjectLinks).values({
			projectId: id,
			creatorId: user.id,
			hackatimeProjectId: parsed.data.id
		}).returning()

		return c.json({
			link: newLink
		}, 201)
	})

	.delete("/:id", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")

		const res = await db.select().from(projects).where(eq(projects.id, id))
		if (res.length == 0) {
			return c.json({ message: "Ressource not found" }, 404)
		}
		const project = res[0]!
		if (project.creatorId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}

		const deleted = await db.delete(projects).where(and(
			eq(projects.id, id)
		))

		return c.json({
			message: "Project deleted",
			old: deleted
		})
	})

export { projectsRoute as default }
