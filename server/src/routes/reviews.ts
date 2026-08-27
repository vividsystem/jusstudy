import { describeRoute, validator as zValidator } from "hono-openapi";
import type { auth } from "@server/auth";
import db from "@server/db";
import { projectReviews, projects, projectShips, projectLocks, type ProjectCategories } from "@server/db/schema";
import { and, asc, eq, getTableColumns, inArray } from "drizzle-orm";
import { NewReviewSchema, LockReviewSchema, PendingShipsResponseSchema, ProjectReviewsResponseSchema, ShipReviewsResponseSchema } from "@shared/validation"
import { Hono } from "hono";
import { bumpStatus } from "@server/lib/ships";
import type { Env } from "..";
import { getCurrentShipTime } from "@server/db/helpers/time";
import { internalServerError, messageResponse, missingPermissionsError, notFoundError, successResponse, unauthorizedError } from "@server/lib/responses";

export const reviewsRoute = new Hono<Env>()
	.get(
		"/pending",
		describeRoute({
			responses: {
				401: unauthorizedError,
				403: missingPermissionsError,
				500: internalServerError,
				200: successResponse(PendingShipsResponseSchema)
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.type === "participant") return c.json({ message: "Forbidden" }, 403)

			const logger = c.get("logger")

			const categories = c.req.queries("category") as ProjectCategories[] || []

			const pending = await db
				.select()
				.from(projectShips)
				.innerJoin(projects, eq(projectShips.projectId, projects.id))
				.where(and(
					eq(projectShips.state, "pre-initial"),
					categories.length > 0 ? inArray(projects.category, categories) : undefined
				))
				.orderBy(asc(projectShips.createdAt))

			type PendingWithTime = typeof pending[number] & { timeShipped: number }
			let pendingWithTime: PendingWithTime[] = []
			for (const ship of pending) {
				const time = await getCurrentShipTime(ship.projects.id)
				if (!time.ok) {
					logger.error({ project: ship.projects, ship: ship.project_ships, timeErr: time.error }, "Could not get time of current ship for pending reviews")
					return c.json({ message: "Something went wrong" }, 500)
				}

				pendingWithTime.push({ ...ship, timeShipped: time.data })
			}

			return c.json({
				pendingProjects: pendingWithTime
			})
		})
export const projectReviewsRoute = new Hono<Env>()
	.get(
		"/",
		describeRoute({
			responses: {
				400: messageResponse("Bad request"),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				200: successResponse(ProjectReviewsResponseSchema)
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const id = c.req.param("id")
			if (!id) {
				return c.json({ message: "Bad request" }, 400)
			}

			const res = await db.select().from(projects).where(eq(projects.id, id))
			if (res.length == 0) {
				return c.json({ message: "Ressource not found" }, 404)
			}
			const project = res[0]!
			if (project.creatorId != user.id && user.type == "participant") {
				return c.json({ message: "Forbidden" }, 403)
			}

			const { note, ...reviewCols } = getTableColumns(projectReviews)
			const reviews = (await db.select({
				review: {
					...(user.type != "participant" ? { note } : {}),
					...reviewCols
				}
			}).from(projectShips)
				.where(eq(projectShips.projectId, id))
				.leftJoin(projectReviews, eq(projectReviews.shipId, projectShips.id)))
				.map(r => r.review)
				.filter((r): r is NonNullable<typeof r> => r !== null);

			return c.json({ reviews: (reviews as (typeof projectReviews.$inferSelect)[]) }, 200)
		})

export const shipReviewsRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.get(
		"/",
		describeRoute({
			responses: {
				200: successResponse(ShipReviewsResponseSchema),
				400: messageResponse("Bad request"),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const id = c.req.param("id")
			if (!id) {
				return c.json({ message: "Bad request" }, 400)
			}
			const [ship] = await db.select({
				ship: getTableColumns(projectShips),
				creatorId: projects.creatorId
			}).from(projectShips).where(eq(projectShips.id, id)).innerJoin(projects, eq(projects.id, projectShips.id))
			if (!ship) {
				return c.json({ message: "Ressource not found" }, 404)
			} else if (ship.creatorId != user.id && user.type == "participant") {
				return c.json({ message: "Forbidden" }, 403)
			}
			const staff = user.type != "participant"
			const { note, ...reviewCols } = getTableColumns(projectReviews)
			const reviews = await db.select({
				...(staff ? { note } : {}),
				...reviewCols
			}).from(projectReviews).where(eq(projectReviews.shipId, id))

			return c.json({ reviews }, 200)
		})
	.post(
		"/",
		describeRoute({
			responses: {
				201: messageResponse("Success", ["Review created"]),
				400: messageResponse("Bad request"),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError
			}
		}),
		zValidator("json", NewReviewSchema),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const id = c.req.param("id")
			if (!id) {
				return c.json({ message: "Bad request" }, 400)
			}
			const [res] = await db.select().from(projectShips).where(eq(projectShips.id, id)).innerJoin(projects, eq(projects.id, projectShips.projectId))
			if (!res) {
				return c.json({ message: "Ressource not found" }, 404)
			} else if (res.project_ships.state != "pre-initial") {
				return c.json({ message: "Bad request" }, 400)
			}
			const staff = user.type != "participant" && res.projects.creatorId != user.id

			if (!staff) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const data = c.req.valid("json")

			await db.insert(projectReviews).values({ ...data, shipId: id, reviewerId: user.id }).returning()
			if (!data.passed) {
				await db.update(projectShips).set({ state: "failed" }).where(eq(projectShips.id, id))
			} else {
				await db.update(projectShips).set({ state: bumpStatus(res.project_ships.state) }).where(eq(projectShips.id, id))
			}

			return c.json({ message: "Review created" }, 201)

		})
	.post(
		"/lock",
		describeRoute({
			responses: {
				201: messageResponse("Success", ["Project locked"]),
				400: messageResponse("Bad request"),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
			}
		}),
		zValidator("json", LockReviewSchema),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const id = c.req.param("id")
			if (!id) {
				return c.json({ message: "Bad request" }, 400)
			}

			const [res] = await db.select().from(projectShips).where(eq(projectShips.id, id)).innerJoin(projects, eq(projects.id, projectShips.projectId))
			if (!res) {
				return c.json({ message: "Ressource not found" }, 404)
			}
			const staff = user.type != "participant" && res.projects.creatorId != user.id

			if (!staff) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const data = c.req.valid("json")


			await db.insert(projectReviews).values({ ...data, passed: false, shipId: id, reviewerId: user.id }).returning()
			await db.update(projectShips).set({ state: "failed" }).where(eq(projectShips.id, id))
			await db.insert(projectLocks).values({ projectId: res.projects.id, shipId: id })

			return c.json({ message: "Project locked" }, 201)
		})
