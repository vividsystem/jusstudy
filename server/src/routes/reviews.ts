import type { auth } from "@server/auth";
import db from "@server/db";
import { projectReviews, projects, projectShips, type ProjectCategories } from "@server/db/schema";
import { and, asc, eq, getTableColumns, inArray } from "drizzle-orm";
import { Hono } from "hono";

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
		if (project.creatorId != user.id && !user.staff) {
			return c.json({ message: "Forbidden" }, 403)
		}

		const shipCols = getTableColumns(projectShips)
		const { note, ...reviewCols } = getTableColumns(projectReviews)
		const shipsWithReviews = await db.select({
			ship: shipCols,
			review: {
				...(user.staff /*&& user.id != project.creatorId*/ ? { note } : {}),
				...reviewCols,
			}
		}).from(projectShips).where(eq(projectShips.projectId, id)).leftJoin(projectReviews, eq(projectReviews.shipId, projectShips.id))


		return c.json({ shipsWithReviews: shipsWithReviews })

	})
