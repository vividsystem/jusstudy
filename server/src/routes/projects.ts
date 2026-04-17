import db from "@server/db";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator"
import { devlogs, hackatimeProjectLinks, projects, users } from "@server/db/schema";
import { and, eq, getTableColumns, sum } from "drizzle-orm";
import { HackatimeLinkRequestSchema, NewProjectRequestSchema, UpdateProjectRequestSchema } from "@shared/validation/projects";
import { projectDevlogsRoute } from "./devlogs";
import z from "zod";
import { projectShipRoute } from "./ships";
import { projectReviewsRoute } from "./reviews";
import { singleProjectTime, sortedUserProjectTimes } from "@server/hackatime/client";
import type { Env } from "..";


export const projectsRoute = new Hono<Env>()
	//get all projects
	.get("/", async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")

		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const res = await db.query.projects.findMany({
			where: (projects, { eq }) => eq(projects.creatorId, user.id),
			with: {
				hackatimeLinks: true
			}
		})

		const hackatimeRes = await sortedUserProjectTimes(user.slackId, res)
		if (!hackatimeRes.ok) {
			logger.error({ userId: user.id })
			return c.json({ message: "Something went wrong" }, 500)
		}


		return c.json({
			projects: res.map(p => {
				const { hackatimeLinks, ...rest } = p
				return { ...rest, timeSpent: hackatimeRes.timeRec ? hackatimeRes.timeRec[rest.id] || 0 : 0 }
			})
		}, 200)
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
				project: getTableColumns(projects),
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

		const links = await db
			.select()
			.from(hackatimeProjectLinks)
			.where(eq(hackatimeProjectLinks.projectId, id))

		const stats = await singleProjectTime(res[0]!.userSlackId!, links)
		if (!stats.ok) {
			return c.json({ message: "Hackatime fetching went wrong" }, 500)
		}

		return c.json({ project: res[0]!.project, timeSpent: stats.time, timeLogged: res[0]!.timeLogged }, 200)
	})


	//create a new project
	.post("/", async (c) => {
		//no auth required for now
		const user = c.get("user")
		const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		let body;
		try {
			body = await c.req.json()
		} catch (e) {
			return c.json({ message: "Invalid request body" }, 400)

		}

		const parsed = NewProjectRequestSchema.safeParse(body)
		if (!parsed.success) {
			return c.json({ message: z.prettifyError(parsed.error) }, 400)
		}

		// TODO: add auto readmeLink generation

		const [project] = await db.insert(projects).values({
			...parsed.data,
			creatorId: user.id
		}).returning()
		if (!project) {
			logger.error({ body }, "Couldnt insert new project")
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ message: "Project created", project }, 201)
	})


	.patch("/:id", zValidator("json", UpdateProjectRequestSchema), async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")

		const [project] = await db
			.select()
			.from(projects)
			.where(eq(projects.id, id))
		if (!project) {
			return c.json({ message: "Ressource not found" }, 404)
		}
		if (project.creatorId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}


		const data = c.req.valid('json')

		// TODO: add auto readmeLink generation

		const [updatedProject] = await db
			.update(projects)
			.set({
				...data,
			})
			.where(eq(projects.id, id))
			.returning()
		if (!project) {
			logger.error({ projectId: id }, "Couldn't update project")
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ message: "Project updated", updatedProject })
	})

	//link a hackatime project
	.post("/:id/link", zValidator("json", HackatimeLinkRequestSchema), async (c) => {
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

	// disabled to prevent fraud
	// .delete("/:id", async (c) => {
	// 	const user = c.get("user")
	// 	if (!user) return c.json({ message: "Unauthorized" }, 401)
	//
	// 	const id = c.req.param("id")
	//
	// 	const res = await db.select().from(projects).where(eq(projects.id, id))
	// 	if (res.length == 0) {
	// 		return c.json({ message: "Ressource not found" }, 404)
	// 	}
	// 	const project = res[0]!
	// 	if (project.creatorId != user.id) {
	// 		return c.json({ message: "Forbidden" }, 403)
	// 	}
	//
	// 	const deleted = await db.delete(projects).where(and(
	// 		eq(projects.id, id)
	// 	))
	//
	// 	return c.json({
	// 		message: "Project deleted",
	// 		old: deleted
	// 	})
	// })
	.route("/:id/devlogs", projectDevlogsRoute)
	.route("/:id/ships", projectShipRoute)
	.route("/:id/reviews", projectReviewsRoute)

export { projectsRoute as default }
