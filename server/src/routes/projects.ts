import db from "@server/db";
import { Hono } from "hono";
import { describeRoute, validator as zValidator } from "hono-openapi"
import { projectLocks, projects, timeEntries, timeHackatimeLinks } from "@server/db/schema";
import { and, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { HackatimeLinkRequestSchema, NewProjectRequestSchema, UpdateProjectRequestSchema, ProjectsResponseSchema, LocksResponseSchema, ProjectByIdResponseSchema, LocksByProjectIdResponseSchema, ActiveProjectLockResponseSchema, NewProjectResponseSchema, UpdateProjectResponseSchema } from "@shared/validation";
import { projectDevlogsRoute } from "./devlogs";
import z from "zod";
import { projectShipRoute } from "./ships";
import { projectReviewsRoute } from "./reviews";
import { singleProjectTime } from "@server/hackatime/client";
import type { Env } from "..";
import { projectRatingsRoute } from "./vote";
import { auth } from "@server/auth";
import { internalServerError, messageResponse, missingPermissionsError, notFoundError, successResponse, unauthorizedError } from "@server/lib/responses";


export const projectsRoute = new Hono<Env>()
	//get all projects
	.get(
		"/",
		describeRoute({
			responses: {
				401: unauthorizedError,
				200: successResponse(ProjectsResponseSchema)
			}
		}),
		async (c) => {
			const user = c.get("user")

			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const res = await db.select().from(projects).where(eq(projects.creatorId, user.id))

			return c.json({ projects: res }, 200)
		})
	.get(
		"/locks",
		describeRoute({
			responses: {
				200: successResponse(LocksResponseSchema),
				401: unauthorizedError
			}
		}),
		async (c) => {
			const user = c.get("user")

			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const locks = await db
				.select(getTableColumns(projectLocks))
				.from(projectLocks)
				.innerJoin(projects, eq(projects.id, projectLocks.projectId))
				.where(eq(projects.creatorId, user.id))
			return c.json({ locks }, 200)

		})

	// get project by id
	.get(
		"/:id",
		describeRoute({
			responses: {
				200: successResponse(ProjectByIdResponseSchema),
				404: notFoundError,
				400: messageResponse("Bad request", ["Hackatime account needs to be linked!"]),
				500: internalServerError
			}
		}),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			const id = c.req.param("id")

			const [project] = await db.select().from(projects).where(eq(projects.id, id))
			if (!project) {
				return c.json({ message: "Ressource not found" }, 404)
			}

			if (!user || user.id !== project.creatorId) {
				return c.json({ project: { unloggedTime: null, ...project } }, 200)
			}

			const htLinks = await db
				.select({ name: timeHackatimeLinks.hackatimeProjectName })
				.from(timeHackatimeLinks)
				.where(eq(timeHackatimeLinks.projectId, project.id))

			if (htLinks.length === 0) {
				return c.json({ project: { unloggedTime: null, ...project } }, 200)
			}

			const accounts = await auth.api.listUserAccounts({ headers: c.req.raw.headers })
			const htAccount = accounts.find((a) => a.providerId === "hackatime")
			if (!htAccount) {
				return c.json({ message: "Hackatime account needs to be linked!" }, 400)
			}
			const token = await auth.api.getAccessToken({
				headers: c.req.raw.headers,
				body: {
					accountId: htAccount.id
				}
			})
			const stats = await singleProjectTime(token.accessToken, htLinks.map((l) => l.name))
			if (!stats.ok) {
				logger.error({ project, htAccount, res_status: stats.res?.status, res_type: stats.res?.headers.get("Content-Type"), res_url: stats.res?.url }, stats.error)
				return c.json({ message: "Hackatime fetching went wrong" }, 500)
			}

			const [lastEntry] = await db
				.select()
				.from(timeEntries)
				.where(eq(timeEntries.projectId, project.id))
				.orderBy(desc(timeEntries.createdAt))
				.limit(1)

			return c.json({ project: { ...project, unloggedTime: stats.data - (lastEntry?.timeAnchor || 0) } }, 200)
		})
	.get(
		"/:id/locks",
		describeRoute({
			responses: {
				200: successResponse(LocksByProjectIdResponseSchema),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const id = c.req.param("id")

			const [project] = await db.select({ creatorId: projects.creatorId }).from(projects).where(eq(projects.id, id))
			if (!project) {
				return c.json({ message: "Ressource not found" }, 404)
			} else if (user.type != "admin" && user.id !== project.creatorId) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const locks = await db.select().from(projectLocks).where(eq(projectLocks.projectId, id))

			return c.json({ locks: locks }, 200)
		})
	.get(
		"/:id/locks/active",
		describeRoute({
			responses: {
				200: successResponse(ActiveProjectLockResponseSchema),
				401: unauthorizedError,
				404: messageResponse("Not found", ["Ressource not found", "Not locked"]),
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const id = c.req.param("id")

			const [project] = await db.select({ creatorId: projects.creatorId }).from(projects).where(eq(projects.id, id))
			if (!project) {
				return c.json({ message: "Ressource not found" }, 404)
			} else if (user.type != "admin" && user.id !== project.creatorId) {
				return c.json({ message: "Forbidden" })
			}

			const [lock] = await db
				.select()
				.from(projectLocks)
				.where(and(
					eq(projectLocks.projectId, id),
					isNull(projectLocks.unlockedAt)
				))
			if (!lock) {
				return c.json({ message: "Not locked" }, 404)
			}

			return c.json({ lock: lock }, 200)
		})
	.post(
		"/:id/unlock",
		describeRoute({
			responses: {
				200: messageResponse("Success", ["Project unlocked."]),
				401: unauthorizedError,
				403: missingPermissionsError,
				400: messageResponse("Bad request", ["Project not locked"])
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

			const id = c.req.param("id")

			const [lock] = await db
				.select()
				.from(projectLocks)
				.where(and(
					eq(projectLocks.projectId, id),
					isNull(projectLocks.unlockedAt),
				))
			if (!lock) {
				return c.json({ message: "Project not locked" }, 400)
			}


			await db.update(projectLocks)
				.set({ unlockedAt: new Date() })
				.where(and(eq(projectLocks.projectId, lock.projectId), eq(projectLocks.shipId, lock.shipId)))

			return c.json({ message: "Project unlocked." }, 200)

		})
	//create a new project
	.post(
		"/",
		describeRoute({
			responses: {
				401: unauthorizedError,
				500: internalServerError,
				201: successResponse(NewProjectResponseSchema),
			}
		}),
		zValidator("json", NewProjectRequestSchema),
		async (c) => {
			//no auth required for now
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const data = c.req.valid("json")

			// TODO: add auto readmeLink generation

			const [project] = await db.insert(projects).values({
				...data,
				creatorId: user.id
			}).returning()
			if (!project) {
				logger.error({ data }, "Couldnt insert new project")
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({ project }, 201)
		})


	.patch(
		"/:id",
		describeRoute({
			responses: {
				401: unauthorizedError,
				404: notFoundError,
				403: messageResponse("Missing permissions", ["Forbidden", "Project locked."]),
				500: internalServerError,
				200: successResponse(UpdateProjectResponseSchema)
			}
		}),
		zValidator("json", UpdateProjectRequestSchema),
		async (c) => {
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
			} else if (project.creatorId != user.id) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const [lock] = await db
				.select()
				.from(projectLocks)
				.where(and(
					eq(projectLocks.projectId, id),
					isNull(projectLocks.unlockedAt)
				))
			if (lock) {
				return c.json({ message: "Project locked." }, 403)
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

			return c.json({ updatedProject })
		})

	//link a hackatime project
	.post(
		"/:id/link",
		describeRoute({
			responses: {
				401: unauthorizedError,
				404: notFoundError,
				403: missingPermissionsError,
				400: messageResponse("Bad request", ["This hackatime project has already been linked to another project!", "Hackatime account needs to be linked!"]),
				500: internalServerError,
				201: messageResponse("Success", ["Successfully linked"])
			}
		}),
		zValidator("json", HackatimeLinkRequestSchema),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const id = c.req.param("id")

			const [project] = await db.select().from(projects).where(eq(projects.id, id))
			if (!project) {
				return c.json({ message: "Ressource not found" }, 404)
			}
			if (project.creatorId != user.id) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const data = c.req.valid('json')

			const alreadyExisting = await db
				.select()
				.from(timeHackatimeLinks)
				.where(and(
					eq(timeHackatimeLinks.hackatimeProjectName, data.id),
					eq(projects.creatorId, user.id)
				))
				.innerJoin(projects, eq(projects.id, timeHackatimeLinks.projectId))
			if (alreadyExisting.length != 0) {
				return c.json({ message: "This hackatime project has already been linked to another project!" }, 400)
			}

			const accounts = await auth.api.listUserAccounts({ headers: c.req.raw.headers })
			const htAccount = accounts.find((a) => a.providerId === "hackatime")
			if (!htAccount) {
				return c.json({ message: "Hackatime account needs to be linked!" }, 400)
			}
			const token = await auth.api.getAccessToken({
				headers: c.req.raw.headers,
				body: {
					accountId: htAccount.id
				}
			})
			const time = await singleProjectTime(token.accessToken, [data.id])
			if (!time.ok) {
				if (time.error == "Could not find hackatime projects") {
					return c.json({ message: "Ressource not found" }, 404)
				} else {
					logger.error(accounts, time.error)
					return c.json({ message: "Something went wrong" }, 500)
				}
			}

			return await db.transaction(async (tx) => {
				const [prevEntry] = await tx
					.select()
					.from(timeEntries)
					.where(eq(timeEntries.projectId, project.id))
					.orderBy(desc(timeEntries.createdAt))
					.limit(1)

				const [entry] = await db
					.insert(timeEntries)
					.values({
						projectId: project.id,
						duration: 0,
						timeAnchor: (prevEntry?.timeAnchor || 0) + time.data,
						createdBy: user.id,
						type: "htlink"
					}).returning()
				if (!entry) {
					logger.error({ entry, prevEntry, project, new_ht_project: data.id }, "Couldnt create new time entry")
					tx.rollback()
					return c.json({ message: "Something went wrong" }, 500)
				}

				const [newLink] = await db.insert(timeHackatimeLinks).values({
					projectId: project.id,
					link: true,
					hackatimeProjectName: data.id,
					timeEntryId: entry.id
				}).returning()
				if (!newLink) {
					logger.error({ entry, prevEntry, project, new_ht_project: data.id }, "Couldnt create ht link")
					return c.json({ message: "Something went wrong" }, 500)
				}

				return c.json({ message: "Successfully linked" }, 201)
			})
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
	.route("/:id/ratings", projectRatingsRoute)

export { projectsRoute as default }
