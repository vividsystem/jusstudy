import type { auth } from "@server/auth";
import db from "@server/db";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator"
import hackatime from "@server/hackatime";
import { devlogs, hackatimeProjectLinks, projects, users } from "@server/db/schema";
import { and, eq, getTableColumns, sum } from "drizzle-orm";
import { HackatimeLinkRequestSchema, NewProjectRequestSchema } from "@server/validation/projects";

const UpdateProjectRequestSchema = NewProjectRequestSchema.partial().strip()

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
			startDate: new Date(process.env.START_DATE!),
			features: ["projects"]
		})

		if (!stats.success) {
			console.log(stats.error)
			console.log(JSON.stringify(stats))
			return c.json({ message: "Something went wrong" }, 500)
		}


		// to calc logged time in the future maybe make an aggregate function to sum up time each devlog
		let timeRecord: Record<string, number> = {}
		for (let project of res) {
			const ids = project.hackatimeLinks.map((l) => l.hackatimeProjectId)

			// sum time spent up
			stats.data.projects!.filter((p) => ids.includes(p.name)).forEach(p => (
				timeRecord[project.id] = timeRecord[project.id] || 0 + p.total_seconds
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
		const id = c.req.param("id")

		const res = await db.select().from(projects).where(eq(projects.id, id))
		if (res.length == 0) {
			return c.json({ message: "Ressource not found" }, 404)
		}


		return c.json({ project: res[0]! }, 200)
	})
	.get("/:id/time", async (c) => {
		const id = c.req.param("id")

		const res = await db
			.select({
				projects: getTableColumns(projects),
				timeLogged: sum(devlogs.timeSpent).mapWith(Number),
				userSlackId: users.slackId,

			})
			.from(projects)
			.leftJoin(users, eq(users.id, projects.creatorId))
			.leftJoin(hackatimeProjectLinks, eq(hackatimeProjectLinks.projectId, projects.id))
			.leftJoin(devlogs, eq(devlogs.projectId, projects.id))
			.where(eq(projects.id, id))
			.groupBy(projects.id, users.slackId)
		if (res.length == 0) {
			return c.json({ message: "Ressource not found" }, 404)
		}

		const stats = await hackatime.userProjectDetails(res[0]!.userSlackId!)
		if (!stats.success) {
			return c.json({ message: "Hackatime fetching went wrong" }, 500)
		}

		const links = await db
			.select()
			.from(hackatimeProjectLinks)
			.where(eq(hackatimeProjectLinks.projectId, id))

		const linksArray = links.map(l => l.hackatimeProjectId)

		const projectStat = stats.projects.filter(p => linksArray.includes(p.name))
		if (projectStat.length == 0) {
			return c.json({ message: "Hackatime project not found" }, 400)
		}

		return c.json({ project: res[0]!.projects, timeSpent: projectStat[0]!.total_seconds, timeLogged: res[0]!.timeLogged }, 200)
	})


	//create a new project
	.post("/", async (c) => {
		//no auth required for now
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		let body;
		try {
			body = await c.req.json()
		} catch (e) {
			return c.json({ message: "Bad request" }, 400)

		}

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

		return c.json({ message: "Project created", project: res[0]! }, 201)
	})


	.patch("/:id", zValidator("json", UpdateProjectRequestSchema), async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")

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


		const data = c.req.valid('json')

		// TODO: add auto readmeLink generation

		const res = await db
			.update(projects)
			.set({
				...data,
			})
			.where(eq(projects.id, id))
			.returning()
		if (res.length == 0) {
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ message: "Project updated", project: res[0] })
	})


	//link a hackatime project
	.post("/:id/link", zValidator("json", HackatimeLinkRequestSchema), async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")
		const body = c.req.json()

		const res = await db.select().from(projects).where(eq(projects.id, id))
		if (res.length == 0) {
			return c.json({ message: "Ressource not found" }, 404)
		}
		const project = res[0]!
		if (project.creatorId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}

		const data = c.req.valid('json')

		const alreadyExisting = await db.select().from(hackatimeProjectLinks).where(and(
			eq(hackatimeProjectLinks.hackatimeProjectId, data.id),
			//add user eq?
		))
		if (alreadyExisting.length != 0) {
			return c.json({ message: "This hackatime project has already been linked to another project!" }, 400)
		}

		const newLink = await db.insert(hackatimeProjectLinks).values({
			projectId: id,
			hackatimeProjectId: data.id
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
