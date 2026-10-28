import { describeRoute, validator as zValidator } from "hono-openapi";
import { Hono } from "hono";
import { NewOptionRequestSchema, NewShopItemRequestSchema, NewShopItemResponse, NewOptionResponseSchema, NewVariantRequestSchema, UpdateShopItemRequest, ShopItemsResponseSchema, ShopItemByIdResponseSchema, NewVariantResponseSchema, UpdateShopItemResponseSchema, AddRegionAvailabilityToItemRequestSchema, RegionalAvailabilitiesByItemResponseSchema, AddRegionAvailabilityToVariantRequestSchema } from "@shared/validation"
import db from "@server/db";
import { itemVariants, regionalItemAvailabilities, regionalItemVariantAvailabilities, shopItemOptions, shopItems } from "@server/db/schema";
import { eq, getTableColumns, inArray } from "drizzle-orm";
import type { Env } from "..";
import { internalServerError, messageResponse, missingPermissionsError, notFoundError, singleMessageSchema, successResponse, unauthorizedError } from "@server/lib/responses";
import { orderRoutes } from "./orders";
import { regionRoutes } from "./regions";
import { uniqueEntriesEqual } from "@server/lib/arr";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { loggedInAsType } from "@server/middleware/auth";
import { MAX_FILE_SIZE } from "@shared/vars";
import { uploadItemIcon, validImageFormats } from "@server/lib/cdn";
import { bodyLimit } from "hono/body-limit";


export const shopRoute = new Hono<Env>()
	.post(
		"/items",
		describeRoute({
			responses: {
				201: successResponse(NewShopItemResponse),
				400: messageResponse("Bad request", ["Duplicate option names: \"${ option.name }\""]),
				401: unauthorizedError,
				403: missingPermissionsError,
				500: internalServerError
			}
		}),
		zValidator("json", NewShopItemRequestSchema),
		loggedInAsType(["admin"]),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			const { options, ...data } = c.req.valid("json")


			return await db.transaction(async (tx) => {
				const [newItem] = await tx.insert(shopItems).values({ ...data }).returning()
				if (!newItem) {
					logger.error({ userId: user.id, data: { options, ...data } })
					throw new HTTPException(500, { message: "Something went wrong" })
				}

				await tx
					.insert(regionalItemAvailabilities)
					.values(Object.entries(data.regions).map(([regionId, av]) => ({
						itemId: newItem.id,
						regionId,
						...av
					})))


				if (!options || options.length === 0) return c.json({ shopItem: newItem }, 201)

				const newOptions = await tx
					.insert(shopItemOptions)
					.values(options.map((o) => ({ name: o.name, itemId: newItem.id })))
					.returning()
				if (newOptions.length !== options.length) {
					logger.error({ userId: user.id, options, newOptions, newItem }, "Could not insert all new options")
					throw new HTTPException(500, { message: "Something went wrong" })
				}

				const newVariants: typeof itemVariants.$inferSelect[] = []


				for (const option of options) {
					const optionId = newOptions.find(o => o.name === option.name)?.id
					if (!optionId) {
						logger.error({ userId: user.id, newOptions, option }, "Could not find option id for new option")
						throw new HTTPException(500, { message: "Something went wrong" })
					}

					for (const variant of option.variants) {
						const [newVariant] = await tx.insert(itemVariants).values({ ...variant, optionId }).returning()
						if (!newVariant) {
							logger.error({ userId: user.id, option: { ...option, id: optionId }, variant }, "Could not create new variant")
							throw new HTTPException(500, { message: "Something went wrong" })
						}


						await tx.insert(regionalItemVariantAvailabilities).values(Object.entries(variant.prices).map(([regionId, price]) => ({
							variantId: newVariant.id,
							regionId,
							price
						})))

						newVariants.push(newVariant)
					}
				}


				return c.json({ shopItem: newItem, options: newOptions, variants: newVariants }, 201)
			})
		})
	.get(
		"/items",
		describeRoute({
			responses: {
				200: successResponse(ShopItemsResponseSchema)
			}
		}),
		zValidator("query", z.object({
			withRegionAvailabilities: z.string().transform(() => true).optional()
		})),
		async (c) => {
			const query = c.req.valid("query")

			const items = await db
				.select({ ...getTableColumns(shopItems) })
				.from(shopItems)
			if (!query.withRegionAvailabilities) {
				return c.json({ items: (items as (typeof items[number] & { prices: null })[]) }, 200)
			} else {
				let itemsWithAv: (typeof items[number] & { prices: typeof regionalItemAvailabilities.$inferSelect[] })[] = []
				for (const item of items) {
					const prices = await db
						.select()
						.from(regionalItemAvailabilities)
						.where(eq(regionalItemAvailabilities.itemId, item.id))

					itemsWithAv.push({ ...item, prices })
				}
				return c.json({ items: itemsWithAv }, 200)
			}
		})
	.get(
		"/items/:itemId",
		describeRoute({
			responses: {
				200: successResponse(ShopItemByIdResponseSchema),
				404: notFoundError,
				500: internalServerError
			}
		}),
		async (c) => {
			const logger = c.get("logger")
			const itemId = c.req.param("itemId")

			const [item] = await db
				.select()
				.from(shopItems)
				.where(eq(shopItems.id, itemId))
			if (!item) {
				return c.json({ message: "Resource not found" }, 404)
			}

			const availabilities = await db
				.select()
				.from(regionalItemAvailabilities)
				.where(eq(regionalItemAvailabilities.itemId, itemId))
			const options = await db
				.select()
				.from(shopItemOptions)
				.where(eq(shopItemOptions.itemId, itemId))

			if (!options) {
				return c.json({ item: { ...item, options: [], availabilities } }, 200)
			}

			const variants = await db
				.select()
				.from(itemVariants)
				.where(inArray(itemVariants.optionId, options.map((o) => o.id)))
			if (!variants) {
				logger.error({ message: "variants not found even though options exist", item, options })
				return c.json({ message: "Something went wrong" }, 500)
			}

			const variantPrices = await db
				.select()
				.from(regionalItemVariantAvailabilities)
				.where(inArray(regionalItemVariantAvailabilities.variantId, variants.map(v => v.id)))


			const vars = variants.map((v) => ({
				...v,
				prices: Object.fromEntries(variantPrices.filter(p => p.variantId === v.id).map(p => [p.regionId, p.price])) as Record<string, number>,
			}))


			const opts = options.map((opt) => ({ ...opt, variants: vars.filter(v => v.optionId == opt.id) }))

			return c.json({ item: { ...item, options: opts, availabilities } }, 200)
		})
	.put(
		"/items/:id/image",
		describeRoute({
			responses: {
				200: messageResponse("Image uploaded"),
				400: messageResponse("Invalid filetypes"),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				413: messageResponse("File too large")
			}
		}),
		bodyLimit({
			maxSize: MAX_FILE_SIZE,
			onError: (c) => {
				return c.json({ message: "File too large" }, 413)
			}
		}),
		zValidator(
			"form",
			z.object({
				image: z.instanceof(File),
			})
		),
		loggedInAsType(["admin"]),
		async (c) => {
			const itemId = c.req.param("id")

			const [item] = await db
				.select({ id: shopItems.id })
				.from(shopItems)
				.where(eq(shopItems.id, itemId))
			if (!item) {
				return c.json({ message: "Resource not found" }, 404)
			}
			const { image } = c.req.valid("form")

			if (!validImageFormats([image])) {
				return c.json({ message: "Invalid file types" }, 400)
			}
			const res = await uploadItemIcon(image)

			await db.update(shopItems).set({ image: res.url }).where(eq(shopItems.id, itemId))

			return c.json({ message: "Image uploaded" })
		}
	)
	.post(
		"/items/:itemId/options",
		describeRoute({
			responses: {
				201: successResponse(NewOptionResponseSchema),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				500: internalServerError
			}
		}),
		zValidator("json", NewOptionRequestSchema),
		loggedInAsType(["admin"]),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			const { itemId } = c.req.param()
			const data = c.req.valid("json")

			const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId))
			if (!item) {
				return c.json({ message: "Resource not found" }, 404)
			}

			const itemRegions = await db
				.select()
				.from(regionalItemAvailabilities)
				.where(eq(regionalItemAvailabilities.itemId, item.id))

			for (const variant of data.variants) {
				const givenRegionIds = Object.keys(variant.prices)
				const regionParity = uniqueEntriesEqual(itemRegions.map(r => r.regionId), givenRegionIds)
				if (!regionParity) {
					return c.json({ message: "Regional prices invalid" }, 400)
				}
			}

			return db.transaction(async (tx) => {
				const [option] = await tx
					.insert(shopItemOptions)
					.values({ name: data.name, itemId: item.id })
					.returning()
				if (!option) {
					logger.error({ item, userId: user.id }, "couldnt create option")
					throw new HTTPException(500, { message: "Something went wrong" })
				}

				for (const v of data.variants) {
					const [variant] = await tx.insert(itemVariants).values({ ...v, optionId: option.id }).returning()
					if (!variant) {
						logger.error({ data, option }, "new variant couldnt be created")
						throw new HTTPException(500, { message: "Something went wrong" })
					}

					const prices = await tx
						.insert(regionalItemVariantAvailabilities).values(
							Object.entries(v.prices).map(([regionId, price]) => ({
								variantId: variant.id,
								regionId,
								price
							}))).returning()
					if (prices.length !== itemRegions.length) {
						logger.error({ prices, itemRegions }, "Could not add all variant prices")
						throw new HTTPException(500, { message: "Something went wrong" })
					}
				}

				return c.json({ option: option }, 201)
			})
		})
	.post(
		"/options/:optionId/variants",
		describeRoute({
			responses: {
				201: successResponse(NewVariantResponseSchema),
				400: messageResponse("Bad request", ["Regional prices invalid"]),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				500: internalServerError
			}
		}),
		zValidator("json", NewVariantRequestSchema),
		loggedInAsType(["admin"]),
		async (c) => {
			const logger = c.get("logger")

			const { optionId } = c.req.param()
			const data = c.req.valid("json")

			const [option] = await db.select().from(shopItemOptions).where(eq(shopItemOptions.id, optionId))
			if (!option) {
				return c.json({ message: "Resource not found" }, 404)
			}

			const [item] = await db.select().from(shopItems).where(eq(shopItems.id, option.itemId))
			if (!item) {
				return c.json({ message: "Resource not found" }, 404)
			}

			const itemRegions = await db
				.select()
				.from(regionalItemAvailabilities)
				.where(eq(regionalItemAvailabilities.itemId, item.id))

			const regionParity = uniqueEntriesEqual(itemRegions.map(r => r.regionId), Object.keys(data.prices))
			if (!regionParity) {
				return c.json({ message: "Regional prices invalid" }, 400)
			}

			return db.transaction(async (tx) => {
				const [variant] = await tx.insert(itemVariants).values({ ...data, optionId: option.id }).returning()
				if (!variant) {
					logger.error({ data, option }, "new variant couldnt be created")
					throw new HTTPException(500, { message: "Something went wrong" })
				}

				const prices = await tx
					.insert(regionalItemVariantAvailabilities).values(
						Object.entries(data.prices).map(([regionId, price]) => ({
							variantId: variant.id,
							regionId,
							price
						}))).returning()
				if (prices.length !== itemRegions.length) {
					logger.error({ prices, itemRegions }, "Could not add all variant prices")
					throw new HTTPException(500, { message: "Something went wrong" })
				}

				return c.json({ variant }, 201)
			})

		})
	.post(
		"/items/:itemId/retire",
		describeRoute({
			responses: {
				200: messageResponse("Success", ["Item successfully taken out of the shop"]),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError
			}
		}),
		loggedInAsType(["admin"]),
		async (c) => {
			const itemId = c.req.param("itemId")


			const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId))
			if (!item) {
				return c.json({ message: "Resource not found" }, 404)
			}

			await db
				.update(regionalItemAvailabilities)
				.set({ quantity: 0 })
				.where(eq(regionalItemAvailabilities.itemId, itemId))

			return c.json({ message: "Item successfully taken out of the shop" }, 200)
		})

	.patch(
		"/items/:itemId",
		describeRoute({
			responses: {
				200: successResponse(UpdateShopItemResponseSchema),
				401: unauthorizedError,
				403: missingPermissionsError,
				500: internalServerError
			}
		}),
		zValidator("json", UpdateShopItemRequest),
		loggedInAsType(["admin"]),
		async (c) => {
			const itemId = c.req.param("itemId")
			const data = c.req.valid("json")

			const [item] = await db
				.update(shopItems)
				.set({ ...data })
				.where(eq(shopItems.id, itemId))
				.returning()
			if (!item) {
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({ item: item }, 200)
		})
	.post("/items/:itemId/availabilities",
		describeRoute({
			responses: {
				201: successResponse(singleMessageSchema("Made available in region")),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError
			}
		}),
		zValidator("json", AddRegionAvailabilityToItemRequestSchema),
		loggedInAsType(["admin"]),
		async (c) => {
			const itemId = c.req.param("itemId")
			const data = c.req.valid("json")

			const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId))
			if (!item) {
				return c.json({ message: "Resource not found" }, 404)
			}

			await db
				.insert(regionalItemAvailabilities)
				.values({ ...data, itemId })

			return c.json({ message: "Made available in region" }, 201)
		})
	.get("/items/:itemId/availabilities",
		describeRoute({
			responses: {
				200: successResponse(RegionalAvailabilitiesByItemResponseSchema)
			}
		}),
		async (c) => {
			const itemId = c.req.param("itemId")

			const availabilities = await db
				.select()
				.from(regionalItemAvailabilities)
				.where(eq(regionalItemAvailabilities.itemId, itemId))

			return c.json({ availabilities }, 200)
		})
	.post("/variants/:variantId/availabilities",
		describeRoute({
			responses: {
				201: successResponse(singleMessageSchema("Made available in region")),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError
			}
		}),
		zValidator("json", AddRegionAvailabilityToVariantRequestSchema),
		loggedInAsType(["admin"]),
		async (c) => {
			const variantId = c.req.param("variantId")
			const data = c.req.valid("json")

			const [variant] = await db.select().from(itemVariants).where(eq(itemVariants.id, variantId))
			if (!variant) {
				return c.json({ message: "Resource not found" }, 404)
			}

			await db
				.insert(regionalItemVariantAvailabilities)
				.values({ ...data, variantId })

			return c.json({ message: "Made available in region" }, 201)

		}
	)
	.route("/orders", orderRoutes)
	.route("/regions", regionRoutes)
