import { zValidator } from "@hono/zod-validator";
import db from "@server/db";
import { addresses, devlogAttachments, devlogs, hackatimeProjectLinks, projectLocks, projects, projectShips, shopOrders, users, userStats } from "@server/db/schema";
import hackatime from "@server/hackatime";
import { and, count, desc, eq, getTableColumns, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { NewAddressSchema } from "@shared/validation/addresses"
import z from "zod";
import type { Env } from "..";
import { sortedUserProjectTimes } from "@server/hackatime/client";

const searchSchema = z.object({
	q: z.string().min(1).max(100),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

export const usersRoutes = new Hono<Env>()
	.get("/hackatime-projects", async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")

		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const res = await hackatime.userProjectDetails(user.slackId, {
			startDate: new Date(process.env.START_DATE!),
		})
		if (!res.success) {
			logger.error({ userId: user.id }, res.error)
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
	.get("/stats", async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const [stats] = await db.select().from(userStats).where(eq(userStats.userId, user.id))

		if (!stats) {
			logger.error({ message: "user doesnt have userStats", userId: user.id })
			return c.json({ message: "Not found" }, 404)
		}


		return c.json({ stats }, 200)
	})
	.get("/:id/stats", async (c) => {
		const loggedInUser = c.get("user")
		const logger = c.get("logger")
		if (!loggedInUser) return c.json({ message: "Unauthorized" }, 401)


		const { id } = c.req.param()


		const [user] = await db.select().from(users).where(eq(users.id, id))
		if (!user) {
			return c.json({ message: "User not found" }, 404)
		}

		const [stats] = await db.select().from(userStats).where(eq(userStats.userId, id))
		if (!stats) {
			logger.error({ message: "user doesnt have userStats", userId: id })
			return c.json({ message: "Not found" }, 404)
		}

		const [resProjects] = await db.select({ nProjects: count() }).from(projects).where(eq(projects.creatorId, id))
		if (!resProjects) {
			logger.error({ message: "couldn't get project number", userId: id })
			return c.json({ message: "Something went wrong" }, 500)
		}

		const [resDevlogs] = await db.select({ nDevlogs: count() }).from(devlogs)
			.innerJoin(projects, eq(devlogs.projectId, projects.id))
			.where(eq(projects.creatorId, id))
		if (!resDevlogs) {
			logger.error({ message: "couldn't get devlog number", userId: id })
			return c.json({ message: "Something went wrong" }, 500)
		}

		const [resShips] = await db.select({ nShips: count() }).from(projectShips)
			.innerJoin(projects, eq(projectShips.projectId, projects.id))
			.where(eq(projects.creatorId, id))

		if (!resShips) {
			logger.error({ message: "couldn't get ship number", userId: id })
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ stats: { ...stats, ...resProjects, ...resDevlogs, ...resShips } }, 200)
	})

	.post("/addresses", zValidator("json", NewAddressSchema), async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const data = c.req.valid("json")

		const res = await db.insert(addresses).values({
			...data,
			userId: user.id
		}).returning()
		if (res.length == 0) {
			logger.error({ userId: user.id, data }, "Couldn't insert address")
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
	.get("/search", zValidator("query", searchSchema), async (c) => {
		const user = c.get("user")
		if (!user || user.type != "admin") return c.json({ message: "Unauthorized" }, 401)

		const { q, limit, offset } = c.req.valid("query");

		const tsQuery = q
			.trim()
			.split(/\s+/)
			.map((word) => `${word}:*`) // this does prefixes as well
			.join(" & ");

		const results = await db
			.select({
				id: users.id,
				name: users.name,
				nickname: users.nickname,
				slackId: users.slackId,
				type: users.type,
				image: users.image,
				rank: sql<number>`ts_rank(search_vector, to_tsquery('english', ${tsQuery}))`,
			})
			.from(users)
			.where(
				sql`search_vector @@ to_tsquery('english', ${tsQuery})`
			)
			.orderBy(desc(sql`ts_rank(search_vector, to_tsquery('english', ${tsQuery}))`))
			.limit(limit)
			.offset(offset);
		if (results.length === 0) {
			return c.json({ message: "No users found" }, 404)
		}

		return c.json({ results, query: q }, 200);
	})
	.post("/:id/ban", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)
		if (user.type != "fraud" && user.type != "admin") return c.json({ message: "Forbidden" }, 403)

		const { id } = c.req.param()

		await db.update(users).set({ banned: true, type: "participant", coins: 0 }).where(eq(users.id, id))
		await db.delete(shopOrders).where(and(
			eq(shopOrders.userId, id),
			isNull(shopOrders.fulfilledAt)
		))

		const alreadyFulfilled = db.select().from(shopOrders).where(and(
			eq(shopOrders.userId, id),
			isNotNull(shopOrders.fulfilledAt)
		))

		return c.json({ message: "User successfully banned!", alreadyFulfilledOrders: alreadyFulfilled }, 200)
	})
	.get("/:id", async (c) => {
		const loggedInUser = c.get("user")
		if (!loggedInUser) return c.json({ message: "Unauthorized" }, 401)

		const { id } = c.req.param()

		const { searchVector, email, name, emailVerified, yswsEligible, verificationStatus, ...rest } = getTableColumns(users)

		const [user] = await db.select({
			...(loggedInUser.id == id ? { email, name, emailVerified, yswsEligible, verificationStatus } : {}),
			...rest
		}).from(users).where(eq(users.id, id))
		if (!user) {
			return c.json({ message: "User not found" }, 404)
		}

		return c.json({ user }, 200)
	})
	.get("/:id/locks", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const { id } = c.req.param()
		if (user.id !== id && user.type != "admin") return c.json({ message: "Forbidden" }, 403)


		const locks = await db
			.select(getTableColumns(projectLocks))
			.from(projectLocks)
			.innerJoin(projects, eq(projects.id, projectLocks.projectId))
			.where(eq(projects.creatorId, id))
		return c.json({ locks }, 200)
	})

	.get("/:id/projects", async (c) => {
		const loggedInUser = c.get("user")
		const logger = c.get("logger")
		if (!loggedInUser) return c.json({ message: "Unauthorized" }, 401)

		const { id } = c.req.param()


		const [user] = await db.select().from(users).where(eq(users.id, id))
		if (!user) {
			return c.json({ message: "User not found" }, 404)
		}

		const res = await db.query.projects.findMany({
			where: (projects, { eq }) => eq(projects.creatorId, id),
			with: {
				hackatimeLinks: true
			}
		})

		const hackatimeRes = await sortedUserProjectTimes(user.slackId, res)
		if (!hackatimeRes.ok) {
			logger.error({ message: hackatimeRes.error, userId: id })
			return c.json({ message: "Something went wrong" }, 500)
		}


		return c.json({
			projects: res.map(p => {
				const { hackatimeLinks, ...rest } = p
				return { ...rest, timeSpent: hackatimeRes.timeRec ? hackatimeRes.timeRec[rest.id] || 0 : 0 }
			})
		}, 200)
	})
	.get("/:id/devlogs", async (c) => {
		const loggedInUser = c.get("user")
		if (!loggedInUser) return c.json({ message: "Unauthorized" }, 401)

		const { id } = c.req.param()


		const [user] = await db.select().from(users).where(eq(users.id, id))
		if (!user) {
			return c.json({ message: "User not found" }, 404)
		}



		const d = await db
			.select({
				...getTableColumns(devlogs), project: {
					id: projects.id,
					name: projects.name
				}
			})
			.from(devlogs)
			.innerJoin(projects, eq(projects.id, devlogs.projectId))
			.where(eq(projects.creatorId, id))
			.orderBy(desc(devlogs.createdAt))


		// TODO: make this more efficient
		const devlogIds: string[] = []
		const dlogs: ((typeof d)[number] & { attachments: { createdAt: Date, cdnURL: string }[] })[] = d.map((devlog) => {
			devlogIds.push(devlog.id)
			return { ...devlog, attachments: [] }
		})

		const atts = await db.select().from(devlogAttachments).where(inArray(devlogAttachments.devlogId, devlogIds))

		atts.forEach((att) => {
			const { devlogId, ...rest } = att
			dlogs.find((d) => d.id == devlogId)?.attachments.push(rest)
		})



		return c.json({ devlogs: dlogs }, 201)
	})
