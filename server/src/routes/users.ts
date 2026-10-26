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
import { HTTPException } from "hono/http-exception";
import { ENV } from "@server/lib/config";
import { loggedIn, loggedInAsType } from "@server/middleware/auth";

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
		loggedIn,
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")

			const token = await getHackatimeAccessToken(c.req.raw.headers)
			if (!token) {
				return c.json({ message: "Hackatime account needs to be linked!" }, 400)
			}

			const res = await hackatime.projects(token.accessToken, { startDate: ENV.START_DATE })
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

			const allHTProjects = res.data.projects
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
		loggedIn,
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")

			const [stats] = await db.select().from(userStats).where(eq(userStats.userId, user.id))

			if (!stats) {
				logger.error({ message: "User doesnt have userStats", userId: user.id })
				return c.json({ message: "Resource not found" }, 500)
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
		loggedIn,
		async (c) => {
			const logger = c.get("logger")
			const { id } = c.req.param()


			const [user] = await db.select().from(users).where(eq(users.id, id))
			if (!user) {
				return c.json({ message: "Resource not found" }, 404)
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
		loggedIn,
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")

			const data = c.req.valid("json")

			const [address] = await db.insert(addresses).values({
				...data,
				userId: user.id
			}).returning()
			if (!address) {
				logger.error({ userId: user.id }, "Couldn't insert address")
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
		loggedIn,
		async (c) => {
			const user = c.get("user")
			const res = await db.select().from(addresses).where(eq(addresses.userId, user.id))

			return c.json({ addresses: res }, 200)
		})
	.get(
		"/search",
		describeRoute({
			responses: {
				200: successResponse(UserSearchResponseSchema),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError
			}
		}),
		zValidator("query", searchSchema),
		loggedInAsType(["admin"]),
		async (c) => {
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
					rank: sql<number>`ts_rank(search_vector, plainto_tsquery('english', ${tsQuery}))`,
				})
				.from(users)
				.where(
					sql`search_vector @@ plainto_tsquery('english', ${tsQuery})`
				)
				.orderBy(desc(sql`ts_rank(search_vector, plainto_tsquery('english', ${tsQuery}))`))
				.limit(limit)
				.offset(offset);
			if (results.length === 0) {
				return c.json({ message: "Resource not found" }, 404)
			}
			return c.json({ results, query: q }, 200);
		})
	.post(
		"/:id/ban",
		describeRoute({
			responses: {
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				200: successResponse(BanUserResponseSchema)
			}
		}),
		loggedInAsType(["admin", "fraud"]),
		async (c) => {
			const { id } = c.req.param()

			const alreadyFulfilled = await db.transaction(async (tx) => {
				const [banned] = await tx
					.update(users)
					.set({ banned: true, type: "participant", coins: 0 })
					.where(eq(users.id, id))
					.returning({ id: users.id })
				if (!banned) {
					throw new HTTPException(404, { message: "Resource not found" })
				}

				await tx.delete(shopOrders).where(and(
					eq(shopOrders.userId, id),
					isNull(shopOrders.fulfilledAt)
				))

				return await tx.select().from(shopOrders).where(and(
					eq(shopOrders.userId, id),
					isNotNull(shopOrders.fulfilledAt)
				))

			})
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
		loggedIn,
		async (c) => {
			const loggedInUser = c.get("user")
			const { id } = c.req.param()

			const { searchVector, email, name, emailVerified, yswsEligible, verificationStatus, ...rest } = getTableColumns(users)

			const [user] = await db.select({
				...(loggedInUser.id == id ? { email, name, emailVerified, yswsEligible, verificationStatus } : {}),
				...rest
			}).from(users).where(eq(users.id, id))
			if (!user) {
				return c.json({ message: "Resource not found" }, 404)
			}

			return c.json({ user }, 200)
		})
	.get("/:id/locks", loggedIn, async (c) => {
		const user = c.get("user")
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
		loggedIn,
		async (c) => {
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
		loggedIn,
		async (c) => {
			const { id } = c.req.param()

			const [user] = await db.select().from(users).where(eq(users.id, id))
			if (!user) {
				return c.json({ message: "Resource not found" }, 404)
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
			const dlogs: ((typeof d)[number] & { attachments: string[] })[] = d.map((devlog) => {
				devlogIds.push(devlog.id)
				return { ...devlog, attachments: [] }
			})

			const atts = await db.select({ devlogId: devlogAttachments.devlogId, cdnURL: devlogAttachments.cdnURL }).from(devlogAttachments).where(inArray(devlogAttachments.devlogId, devlogIds))

			atts.forEach((att) => {
				dlogs.find((d) => d.id == att.devlogId)?.attachments.push(att.cdnURL)
			})

			return c.json({ devlogs: dlogs }, 201)
		})
