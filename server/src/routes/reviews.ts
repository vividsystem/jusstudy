import { zValidator } from "@hono/zod-validator";
import type { auth } from "@server/auth";
import db from "@server/db";
import { projectReviews, projects, projectShips, type ProjectCategories } from "@server/db/schema";
import { and, asc, eq, getTableColumns, inArray } from "drizzle-orm";
import { NewReviewSchema } from "@shared/validation/reviews"
import { Hono } from "hono";
import { bumpStatus } from "@server/lib/ships";

export const reviewsRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.get("/pending", async (c) => {
		const categories = c.req.queries("category") as ProjectCategories[] || []

		const pending = await db.select().from(projectShips).innerJoin(projects, eq(projectShips.projectId, projects.id)).where(and(
			eq(projectShips.state, "pre-initial"),
			categories.length > 0 ? inArray(projects.category, categories) : undefined
		)).orderBy(asc(projectShips.createdAt))

		return c.json({
			pendingProjects: pending
		})
	})
export const projectReviewsRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.get("/", async (c) => {
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
		if (user.type != "participant") {
			const reviews = (await db.select({
				review: {
					...reviewCols,
					note
				}
			}).from(projectShips)
				.where(eq(projectShips.projectId, id))
				.leftJoin(projectReviews, eq(projectReviews.shipId, projectShips.id)))
				.map(r => r.review)
				.filter((r): r is NonNullable<typeof r> => r !== null);

			return c.json({ reviews: (reviews as (typeof projectReviews.$inferSelect)[]) }, 200)
		} else {
			const reviews = (await db.select({
				review: reviewCols,
			}).from(projectShips)
				.where(eq(projectShips.projectId, id))
				.leftJoin(projectReviews, eq(projectReviews.shipId, projectShips.id)))
				.map(r => r.review)
				.filter((r): r is NonNullable<typeof r> => r !== null);

			return c.json({
				reviews: (reviews as Omit<(typeof projectReviews.$inferSelect), "note">[])
			}, 200)
		}
	})

export const shipReviewsRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.get("/", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")
		if (!id) {
			return c.json({ message: "Bad request" }, 400)
		}
		const res = await db.select({
			ship: getTableColumns(projectShips),
			creatorId: projects.creatorId
		}).from(projectShips).where(eq(projectShips.id, id)).leftJoin(projects, eq(projects.id, projectShips.id))
		if (res.length == 0) {
			return c.json({ message: "Ship not found" }, 404)
		} else if (res[0]!.creatorId == null) {
			return c.json({ message: "Something went wrong" }, 500)
		} else if (res[0]!.creatorId != user.id && user.type == "participant") {
			return c.json({ message: "Forbidden" }, 403)
		}
		const staff = user.type != "participant" /*&& res[0]!.creatorId != user.id*/
		const { note, ...reviewCols } = getTableColumns(projectReviews)
		const reviews = await db.select({
			...(staff ? { note } : {}),
			...reviewCols
		}).from(projectReviews).where(eq(projectReviews.shipId, id))

		return c.json({ reviews }, 200)
	})
	.post("/", zValidator("json", NewReviewSchema), async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const id = c.req.param("id")
		if (!id) {
			return c.json({ message: "Bad request" }, 400)
		}
		const res = await db.select().from(projectShips).where(eq(projectShips.id, id))
		if (res.length == 0) {
			return c.json({ message: "Ship not found" }, 404)
		}
		const ship = res[0]!
		const staff = user.type != "participant" /*&& res[0]!.creatorId != user.id*/

		if (!staff) {
			return c.json({ message: "Forbidden" }, 403)
		}

		const data = c.req.valid("json")

		if (ship.state != data.type) {
			return c.json({ message: "Review type does not match ship state" }, 400)
		}

		if (data.type == "pre-fraud" && user.type != "fraud" && user.type != "admin") {
			return c.json({ message: "Forbidden" }, 403)
		}

		const _reviewRes = await db.insert(projectReviews).values({ ...data, shipId: id, reviewerId: user.id }).returning()
		if (!data.passed) {
			await db.update(projectShips).set({ state: "failed" }).where(eq(projectShips.id, id))
		} else {
			await db.update(projectShips).set({ state: bumpStatus(ship.state) }).where(eq(projectShips.id, id))
		}

		return c.json({ message: "Review created!" }, 201)

	})
