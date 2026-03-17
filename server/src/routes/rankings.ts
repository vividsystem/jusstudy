import type { auth } from "@server/auth";
import db from "@server/db";
import { projects, projectStats, users } from "@server/db/schema";
import { and, avg, count, desc, eq, getTableColumns, ne, sql, sum } from "drizzle-orm";
import { Hono } from "hono";

export const rankingsRoute = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>()
	.get("/projects", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const projectCols = getTableColumns(projects)
		const res = await db.select({
			...projectCols,
			mu: projectStats.mu,
			sigma: projectStats.sigma,
			ordinal: projectStats.ordinal,
			matchups: projectStats.matchups,
			creator: {
				id: users.id,
				name: users.nickname,
				avatar: users.image
			}
		}).from(projects)
			.innerJoin(projectStats, eq(projectStats.projectId, projects.id))
			.innerJoin(users, eq(projects.creatorId, users.id))
			.where(and(
				ne(projectStats.matchups, 0),
				eq(users.banned, false)
			))
			.orderBy(desc(projectStats.ordinal)).limit(50)


		return c.json({
			ranking: res.map((res, i) => ({ ...res, position: i + 1 }))
		}, 200)

	})
	.get("/users", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const res = await db.select({
			avgOrdinals: avg(projectStats.ordinal),
			nProjects: count(),
			matchups: sum(projectStats.matchups),
			userScore: sql<number>`${avg(projectStats.ordinal)} * ln(1 + ${count()})`,
			creator: {
				id: users.id,
				name: users.nickname,
				avatar: users.image
			}
		}).from(projects)
			.innerJoin(projectStats, eq(projectStats.projectId, projects.id))
			.innerJoin(users, eq(projects.creatorId, users.id))
			.where(and(
				ne(projectStats.matchups, 0),
				eq(users.banned, false)
			))
			.groupBy(users.id)
			.orderBy(desc(sql<number>`${avg(projectStats.ordinal)} * ln(1 + ${count()})`)).limit(50)

		return c.json({
			ranking: res.map((res, i) => ({ ...res, position: i + 1 }))
		}, 200)
	})
