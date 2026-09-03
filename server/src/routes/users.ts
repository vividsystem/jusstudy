import { describeRoute, validator as zValidator } from "hono-openapi";
import db from "@server/db";
import { addresses, devlogAttachments, devlogs, projectLocks, projects, projectShips, shopOrders, timeEntries, timeHackatimeLinks, users, userStats } from "@server/db/schema";
import hackatime from "@server/hackatime/client";
import { and, count, desc, eq, getTableColumns, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { NewAddressRequestSchema, HackatimeProjectResponseSchema, UserStatsResponseSchema, UserStatsByIdResponseSchema, NewAddressResponseSchema, AddressesResponseSchema, UserSearchResponseSchema, BanUserResponseSchema, UserByIdResponseSchema, UserProjectsResponseSchema, UserDevlogsResponseSchema } from "@shared/validation"
import z from "zod";
import type { Env } from "..";
import { internalServerError, messageResponse, missingPermissionsError, notFoundError, successResponse, unauthorizedError } from "@server/lib/responses";
import { getHackatimeAccessToken } from "@server/lib/auth";

const searchSchema = z.object({
	q: z.string().min(1).max(100),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

export const usersRoutes = new Hono<Env>()
	.get(
		"/hackatime-projects",
		describeRoute({
			responses: {
				200: successResponse(HackatimeProjectResponseSchema),
				400: messageResponse("Bad request", ["Hackatime account needs to be linked!"]),
				401: unauthorizedError,
				500: internalServerError
			}
		}),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")

			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const token = await getHackatimeAccessToken(c.req.raw.headers)
			if (!token) {
				return c.json({ message: "Hackatime account needs to be linked!" }, 400)
			}

			const res = await hackatime.projects(token.accessToken, { startDate: new Date(process.env.START_DATE!) })
			if (!res.ok) {
				logger.error({ userId: user.id }, res.error)
				return c.json({ message: "Something went wrong" }, 500)
			}

			const linksInUse = await db.select({
				name: timeHackatimeLinks.hackatimeProjectName
			})
				.from(timeHackatimeLinks)
				.innerJoin(projects, eq(projects.id, timeHackatimeLinks.projectId))
				.where(and(
					eq(projects.creatorId, user.id)
				))
			const alreadyInUse = linksInUse.map(l => l.name)

			const allHTProjects = res.data
			return c.json({
				used: alreadyInUse,
				unused: allHTProjects.filter(p => !alreadyInUse.includes(p.name)).map(p => p.name),
			}, 200)

		})
	.get(
		"/stats",
		describeRoute({
			responses: {
				200: successResponse(UserStatsResponseSchema),
				401: unauthorizedError,
				500: internalServerError
			}
		}),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const [stats] = await db.select().from(userStats).where(eq(userStats.userId, user.id))

			if (!stats) {
				logger.error({ message: "User doesnt have userStats", userId: user.id })
				return c.json({ message: "Ressource not found" }, 500)
			}


			return c.json({ stats }, 200)
		})
	.get(
		"/:id/stats",
		describeRoute({
			responses: {
				200: successResponse(UserStatsByIdResponseSchema),
				401: unauthorizedError,
				404: notFoundError,
				500: internalServerError
			}
		}),
		async (c) => {
			const loggedInUser = c.get("user")
			const logger = c.get("logger")
			if (!loggedInUser) return c.json({ message: "Unauthorized" }, 401)


			const { id } = c.req.param()


			const [user] = await db.select().from(users).where(eq(users.id, id))
			if (!user) {
				return c.json({ message: "Ressource not found" }, 404)
			}

			const [stats] = await db.select().from(userStats).where(eq(userStats.userId, id))
			if (!stats) {
				logger.error({ message: "User doesnt have userStats", userId: id })
				return c.json({ message: "Something went wrong" }, 500)
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

	.post(
		"/addresses",
		describeRoute({
			responses: {
				201: successResponse(NewAddressResponseSchema),
				401: unauthorizedError,
				500: internalServerError
			}
		}),
		zValidator("json", NewAddressRequestSchema),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const data = c.req.valid("json")

			const [address] = await db.insert(addresses).values({
				...data,
				userId: user.id
			}).returning()
			if (!address) {
				logger.error({ userId: user.id, data }, "Couldn't insert address")
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({ address }, 201)
		})
	.get(
		"/addresses",
		describeRoute({
			responses: {
				401: unauthorizedError,
				200: successResponse(AddressesResponseSchema)
			}
		}),
		async (c) => {
			const user = c.get("user")

			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const res = await db.select().from(addresses).where(eq(addresses.userId, user.id))

			return c.json({ addresses: res }, 200)
		})
	.get(
		"/search",
		describeRoute({
			responses: {
				200: successResponse(UserSearchResponseSchema),
				401: unauthorizedError,
				404: notFoundError
			}
		}),
		zValidator("query", searchSchema),
		async (c) => {
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
				return c.json({ message: "Ressource not found" }, 404)
			}
			return c.json({ results, query: q }, 200);
		})
	.post(
		"/:id/ban",
		describeRoute({
			responses: {
				401: unauthorizedError,
				403: missingPermissionsError,
				200: successResponse(BanUserResponseSchema)
			}
		}),
		async (c) => {
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
	.get(
		"/:id",
		describeRoute({
			responses: {
				200: successResponse(UserByIdResponseSchema),
				401: unauthorizedError,
				404: notFoundError
			}
		}),
		async (c) => {
			const loggedInUser = c.get("user")
			if (!loggedInUser) return c.json({ message: "Unauthorized" }, 401)

			const { id } = c.req.param()

			const { searchVector, email, name, emailVerified, yswsEligible, verificationStatus, ...rest } = getTableColumns(users)

			const [user] = await db.select({
				...(loggedInUser.id == id ? { email, name, emailVerified, yswsEligible, verificationStatus } : {}),
				...rest
			}).from(users).where(eq(users.id, id))
			if (!user) {
				return c.json({ message: "Ressource not found" }, 404)
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

	.get(
		"/:id/projects",
		describeRoute({
			responses: {
				401: unauthorizedError,
				200: successResponse(UserProjectsResponseSchema)
			}
		}),
		async (c) => {
			const loggedInUser = c.get("user")
			if (!loggedInUser) return c.json({ message: "Unauthorized" }, 401)

			const { id } = c.req.param()


			const [user] = await db.select().from(users).where(eq(users.id, id))
			if (!user) {
				return c.json({ message: "User not found" }, 404)
			}

			const userProjects = await db.select().from(projects).where(eq(projects.creatorId, user.id))

			return c.json({
				userProjects
			}, 200)
		})
	.get(
		"/:id/devlogs",
		describeRoute({
			responses: {
				200: successResponse(UserDevlogsResponseSchema),
				401: unauthorizedError,
				404: notFoundError
			}
		}),
		async (c) => {
			const loggedInUser = c.get("user")
			if (!loggedInUser) return c.json({ message: "Unauthorized" }, 401)

			const { id } = c.req.param()


			const [user] = await db.select().from(users).where(eq(users.id, id))
			if (!user) {
				return c.json({ message: "Ressource not found" }, 404)
			}



			const d = await db
				.select({
					...getTableColumns(devlogs),
					timeLogged: timeEntries.duration,
					project: {
						id: projects.id,
						name: projects.name
					}
				})
				.from(devlogs)
				.innerJoin(projects, eq(projects.id, devlogs.projectId))
				.innerJoin(timeEntries, eq(timeEntries.id, devlogs.timeEntryId))
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
