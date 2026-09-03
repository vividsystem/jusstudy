import { Hono } from "hono";
import { validator as zValidator } from "hono-openapi"
import type { Env } from "..";
import db from "@server/db";
import { describeRoute } from "hono-openapi";
import { internalServerError, missingPermissionsError, notFoundError, successResponse, unauthorizedError } from "@server/lib/responses";
import { NewRegionResponseSchema, NewRegionRequestSchema, RegionsByIdResponseSchema, RegionsResponseSchemma, RegionalItemsResponseSchema, RegionalItemByIdResponseSchema } from "@shared/validation";
import { regionalItemAvailabilities, shopItems, shopRegions } from "@server/db/schema";
import { and, eq, getTableColumns } from "drizzle-orm";

export const regionRoutes = new Hono<Env>()
	.post("/",
		describeRoute({
			responses: {
				201: successResponse(NewRegionResponseSchema),
				401: unauthorizedError,
				403: missingPermissionsError,
				500: internalServerError
			}
		}),
		zValidator("json", NewRegionRequestSchema),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			else if (user.type !== "admin") return c.json({ message: "Forbidden" }, 403)
			const data = c.req.valid("json")

			const [region] = await db
				.insert(shopRegions)
				.values(data)
				.returning()
			if (!region) {
				logger.error({ data, userId: user.id }, "Could not create new region")
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({ region }, 201)

		})
	.get("/",
		describeRoute({
			responses: {
				200: successResponse(RegionsResponseSchemma)
			}
		}),
		async (c) => {
			const regions = await db.select().from(shopRegions)

			return c.json({ regions }, 200)
		})
	.get("/:id", describeRoute({
		responses: {
			200: successResponse(RegionsByIdResponseSchema),
			404: notFoundError
		}
	}),
		async (c) => {
			const { id } = c.req.param()

			const [region] = await db.select().from(shopRegions).where(eq(shopRegions.id, id))
			if (!region) {
				return c.json({ message: "Ressource not found" }, 404)
			}

			return c.json({ region }, 200)
		})
	.get("/:id/items",
		describeRoute({
			responses: {
				200: successResponse(RegionalItemsResponseSchema)
			}
		}),
		async (c) => {
			const { id } = c.req.param()
			const { createdAt, itemId, regionId, ...av } = getTableColumns(regionalItemAvailabilities)
			const items = await db
				.select({
					...(getTableColumns(shopItems)),
					availableSince: createdAt,
					...av

				})
				.from(shopItems)
				.innerJoin(regionalItemAvailabilities, eq(shopItems.id, regionalItemAvailabilities.itemId))
				.where(eq(regionalItemAvailabilities.regionId, id))


			return c.json({ items }, 200)
		})
	.get("/:id/items/:itemId",
		describeRoute({
			responses: {
				200: successResponse(RegionalItemByIdResponseSchema),
				404: notFoundError
			}
		}),
		async (c) => {

			const { id, itemId } = c.req.param()
			const { createdAt, itemId: _iId, regionId, ...av } = getTableColumns(regionalItemAvailabilities)
			const [item] = await db
				.select({
					...(getTableColumns(shopItems)),
					availableSince: createdAt,
					...av

				})
				.from(shopItems)
				.innerJoin(regionalItemAvailabilities, eq(shopItems.id, regionalItemAvailabilities.itemId))
				.where(and(
					eq(regionalItemAvailabilities.regionId, id),
					eq(shopItems.id, itemId)
				))
			if (!item) {
				return c.json({ message: "Ressource not found" }, 404)
			}


			return c.json({ item }, 200)

		}
	)
