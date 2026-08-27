import { describeRoute, validator as zValidator } from "hono-openapi";
import { Hono } from "hono";
import { NewOptionRequest, NewShopItemRequest, NewShopItemResponse, NewOptionResponseSchema, NewVariantRequest, PlaceOrderRequest, UpdateShopItemRequest, ShopItemsResponseSchema, ShopItemByIdResponseSchema, NewVariantResponseSchema, UpdateShopItemResponseSchema, PlaceOrderResponseSchema, OrderByIdResponseSchema, UserOrdersResponseSchema } from "@shared/validation"
import db from "@server/db";
import { addresses, itemVariants, orderVariantSelection, shopItemOptions, shopItems, shopOrders, users } from "@server/db/schema";
import { asc, count, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import type { Env } from "..";
import { internalServerError, messageResponse, missingPermissionsError, notFoundError, successResponse, unauthorizedError } from "@server/lib/responses";


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
		zValidator("json", NewShopItemRequest),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

			const { options, ...data } = c.req.valid("json")


			return await db.transaction(async (tx) => {
				const [newItem] = await db.insert(shopItems).values({ ...data }).returning()
				if (!newItem) {
					logger.error({ userId: user.id, data: { options, ...data } })
					tx.rollback()
					return c.json({ message: "Something went wrong" }, 500)
				}

				if (!options || options.length === 0) return c.json({ shopItem: newItem }, 201)


				const n: string[] = []

				for (let option of options) {
					if (n.includes(option.name)) {
						return c.json({ message: `Duplicate option names: "${option.name}"` }, 400)
					} else {
						n.push(option.name)
					}

				}

				const newOptions = await db.insert(shopItemOptions).values(options.map((o) => ({ name: o.name, itemId: newItem.id }))).returning()
				if (newOptions.length === 0) {
					logger.error({ userId: user.id, data: { options, ...data }, newItem })
					tx.rollback()
					return c.json({ message: "Something went wrong" }, 500)
				}

				const newVariants = await db.insert(itemVariants).values(
					options.flatMap((o) =>
						o.variants.map((v) => ({
							...v,
							optionId: newOptions.find(fo => fo.name == o.name)!.id
						})
						)
					)).returning()
				if (newVariants.length == 0) {
					logger.error({ userId: user.id, data: { options, ...data }, newItem, newOptions })
					tx.rollback()
					return c.json({ message: "Something went wrong" }, 500)
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
		async (c) => {
			const items = await db.select().from(shopItems).orderBy(asc(shopItems.basePrice))


			return c.json({ shopItems: items, message: "Variants not included" }, 200)
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
			const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId))
			if (!item) {
				return c.json({ message: "Ressource not found" }, 404)
			}
			const options = await db
				.select()
				.from(shopItemOptions)
				.where(eq(shopItemOptions.itemId, itemId))

			if (!options) {
				return c.json({ item: { ...item, options: [] } }, 200)
			}

			const variants = await db.select().from(itemVariants).where(inArray(itemVariants.optionId, options.map((o) => o.id)))
			if (!variants) {
				logger.error({ message: "variants not found even though options exist", item, options })
				return c.json({ message: "Something went wrong" }, 500)
			}


			const opts = options.map((opt) => ({ ...opt, variants: variants.filter(v => v.optionId == opt.id) }))

			return c.json({ item: { ...item, options: opts } }, 200)
		})
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
		zValidator("json", NewOptionRequest),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

			const { itemId } = c.req.param()
			const data = c.req.valid("json")

			const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId))
			if (!item) {
				return c.json({ message: "Ressource not found" }, 404)
			}


			const [option] = await db.insert(shopItemOptions).values({ name: data.name, itemId: item.id }).returning()
			if (!option) {
				logger.error({ item, userId: user.id }, "couldnt create option")
				return c.json({ message: "Something went wrong" }, 500)
			}

			const variants = await db.insert(itemVariants).values(data.variants.map((v) => ({ ...v, optionId: option.id }))).returning()
			if (variants.length != data.variants.length) {
				logger.error({ item, userId: user.id, option, variants }, "couldnt create variants completely")
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({ option: { ...option, variants } }, 201)
		})
	.post(
		"/options/:optionId/variants",
		describeRoute({
			responses: {
				201: successResponse(NewVariantResponseSchema),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError,
				500: internalServerError
			}
		}),
		zValidator("json", NewVariantRequest),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

			const { optionId } = c.req.param()
			const data = c.req.valid("json")

			const [option] = await db.select().from(shopItemOptions).where(eq(shopItemOptions.id, optionId))
			if (!option) {
				return c.json({ message: "Ressource not found" }, 404)
			}

			const [variant] = await db.insert(itemVariants).values({ ...data, optionId: option.id }).returning()
			if (!variant) {
				logger.error({ data, option }, "new variant couldnt be created")
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({ variant }, 201)

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
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

			const itemId = c.req.param("itemId")


			const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId))
			if (!item) {
				return c.json({ message: "Ressource not found" }, 404)
			}

			await db.update(shopItems).set({ quantity: 0 }).where(eq(shopItems.id, itemId))

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
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

			const itemId = c.req.param("itemId")
			const data = c.req.valid("json")

			const [item] = await db.update(shopItems).set({ ...data }).where(eq(shopItems.id, itemId)).returning()
			if (!item) {
				return c.json({ message: "Something went wrong" }, 500)
			}

			return c.json({ item: item }, 200)
		})
	.post(
		"/orders",
		describeRoute({
			responses: {
				201: successResponse(PlaceOrderResponseSchema),
				400: messageResponse("Bad request", [
					"You need to specify options and their variants!",
					"Not all options (or too many) given",
					"Not all options exist",
					"Some options do not correspond to the item to be ordered",
					"Not all variants exist",
					"Some variants are not valid",
					"Order too expensive"
				]),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: messageResponse("Not found", ["Item not found", "Address not found"]),
				500: internalServerError
			}
		}),
		zValidator("json", PlaceOrderRequest),
		async (c) => {
			const user = c.get("user")
			const logger = c.get("logger")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			if (user.banned || !user.yswsEligible) return c.json({ message: "Forbidden" }, 403)

			const data = c.req.valid("json")


			const address = await db.select().from(addresses).where(eq(addresses.id, data.addressId))
			if (address.length == 0) {
				return c.json({ message: "Address not found" }, 404)
			} else if (address[0]!.userId != user.id) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const [item] = await db.select().from(shopItems).where(eq(shopItems.id, data.itemId))
			if (!item) {
				return c.json({ message: "Item not found" }, 404)
			}

			const [expected] = await db.select({ n: count() }).from(shopItemOptions).where(eq(shopItemOptions.itemId, data.itemId))
			if (expected == undefined) {
				logger.error({ message: "aggreggate count sql query didnt return anything", data })
				return c.json({ message: "Something went wrong" }, 500)
			}
			if (expected.n > 0 && !data.optionVariants) {
				return c.json({ message: "You need to specify options and their variants!" }, 400)
			}

			const optIds = Object.keys(data.optionVariants || [])
			if (optIds.length != expected.n) {
				return c.json({ message: "Not all options (or too many) given" }, 400)
			}
			const variantIds = Object.values(data.optionVariants || [])

			const options = await db.select().from(shopItemOptions).where(inArray(shopItemOptions.id, optIds))
			if (options.length != expected.n) {
				return c.json({ message: "Not all options exist" }, 400)
			}

			let validOptions = true
			for (let opt of options) {
				if (opt.itemId != item.id) {
					validOptions = false
					break
				}
			}
			if (!validOptions) {
				return c.json({ message: "Some options do not correspond to the item to be ordered" }, 400)
			}

			const variants = await db.select().from(itemVariants).where(inArray(itemVariants.id, variantIds))
			if (variants.length != expected.n) {
				return c.json({ message: "Not all variants exist" }, 400)
			}

			let validVariants = true
			for (let variant of variants) {
				if (!data.optionVariants || data.optionVariants[variant.optionId] != variant.id) {
					validVariants = false
					break
				}
			}
			if (!validVariants) {
				return c.json({ message: "Some variants are not valid" }, 400)
			}

			const variantCost: number = variants.reduce((acc, curr) => curr.additionalPrice + acc, 0)
			const cost = (item.basePrice + variantCost) * data.quantity

			if (user.coins < cost) {
				return c.json({ message: "Order too expensive" }, 400)
			}
			return await db.transaction(async (tx) => {
				const [u] = await tx.update(users).set({ coins: user.coins - cost }).where(eq(users.id, user.id)).returning()
				if (!u) {
					logger.error({ user, data, cost, item, variants }, "user with which order was supposed to be created doesn't exist")
					return c.json({ message: "Something went wrong" }, 500)
				}
				if (u.coins < 0) {
					tx.rollback()
					return c.json({ message: "Order too expensive" }, 400)
				}

				const [placedOrder] = await tx.insert(shopOrders).values({ ...data, userId: user.id, price: cost }).returning()
				if (!placedOrder) {
					logger.error({ userId: user.id, data, cost, item, variants }, "Couldnt place order")
					tx.rollback()
					return c.json({ message: "Something went wrong" }, 500)
				}

				const opts = Object.entries(data.optionVariants || {}).map(([optionId, variantId]) => ({ optionId, variantId, orderId: placedOrder.id }))
				if (opts.length !== 0) {
					const selection = await tx.insert(orderVariantSelection).values(opts).returning()
					if (selection.length == 0) {
						logger.error({ userId: user.id, data, cost, item, variants, placedOrder }, "Couldnt make variant selection")
						tx.rollback()
						return c.json({ message: "Something went wrong" }, 500)
					}
				}


				return c.json({ order: placedOrder }, 201)
			})

		})
	.get(
		"/orders/:orderId",
		describeRoute({
			responses: {
				200: successResponse(OrderByIdResponseSchema),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: notFoundError
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			const orderId = c.req.param("orderId")


			const { addressId, orderNotes, ...rest } = getTableColumns(shopOrders)
			const order = await db.select(rest).from(shopOrders).where(eq(shopOrders.id, orderId))
			if (order.length == 0) {
				return c.json({ message: "Ressource not found" }, 404)
			} else if (order[0]!.userId != user.id) {
				return c.json({ message: "Forbidden" }, 403)
			}

			return c.json({ order: order[0]! }, 200)
		})
	.get(
		"/orders",
		describeRoute({
			responses: {
				200: successResponse(UserOrdersResponseSchema),
				401: unauthorizedError
			}
		}),
		async (c) => {
			const user = c.get("user")
			if (!user) return c.json({ message: "Unauthorized" }, 401)

			const { addressId, orderNotes, itemId, ...rest } = getTableColumns(shopOrders)
			const orders = await db.select({
				...rest,
				item: {
					id: shopItems.id,
					name: shopItems.name,
					image: shopItems.image
				}
			})
				.from(shopOrders)
				.innerJoin(shopItems, eq(shopItems.id, shopOrders.itemId))
				.where(eq(shopOrders.userId, user.id))
				.orderBy(desc(shopOrders.placedAt))

			return c.json({ orders: orders }, 200)
		})
