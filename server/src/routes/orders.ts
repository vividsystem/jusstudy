import { describeRoute, validator as zValidator } from "hono-openapi";
import type { Env } from "..";
import { Hono } from "hono";
import { successResponse, messageResponse, unauthorizedError, missingPermissionsError, internalServerError, notFoundError } from "@server/lib/responses";
import { OrderByIdResponseSchema, PlaceOrderRequest, PlaceOrderResponseSchema, UserOrdersResponseSchema } from "@shared/validation";
import db from "@server/db";
import { addresses, itemVariants, orderVariantSelection, shopItemOptions, shopItems, shopOrders, shopRegions, users, regionalItemAvailabilities, regionalItemVariantAvailabilities } from "@server/db/schema";
import { and, count, desc, eq, getTableColumns, inArray } from "drizzle-orm";

export const orderRoutes = new Hono<Env>()
	.post(
		"/",
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
					"Order too expensive",
					"Order too large"
				]),
				401: unauthorizedError,
				403: missingPermissionsError,
				404: messageResponse("Not found", ["Item not found or not available", "Address not found", "Region not found", "User not found"]),
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

			const [address] = await db
				.select()
				.from(addresses)
				.where(eq(addresses.id, data.addressId))
			if (!address) {
				return c.json({ message: "Address not found" }, 404)
			} else if (address.userId != user.id) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const [region] = await db
				.select()
				.from(shopRegions)
				.where(eq(shopRegions.id, data.regionId))
			if (!region) {
				return c.json({ message: "Region not found" }, 404)
			}

			return db.transaction(async (tx) => {
				const [item] = await tx
					.select({
						...getTableColumns(shopItems),
						price: regionalItemAvailabilities.price,
						quantity: regionalItemAvailabilities.quantity
					})
					.from(shopItems)
					.innerJoin(regionalItemAvailabilities, and(
						eq(regionalItemAvailabilities.regionId, region.id),
						eq(regionalItemAvailabilities.itemId, shopItems.id)
					))
					.where(eq(shopItems.id, data.itemId))
				if (!item) {
					return c.json({ message: "Item not found or not available" }, 404)
				} else if (item.quantity && item.quantity < data.quantity) {
					return c.json({ message: "Order too large" }, 400)
				}

				const [expectedOptions] = await tx
					.select({ n: count() })
					.from(shopItemOptions)
					.where(eq(shopItemOptions.itemId, data.itemId))
				if (!expectedOptions) {
					logger.error({ message: "aggreggate count sql query didnt return anything", data })
					return c.json({ message: "Something went wrong" }, 500)
				}
				if (expectedOptions.n > 0 && !data.optionVariants) {
					return c.json({ message: "You need to specify options and their variants!" }, 400)
				}

				const optIds = Object.keys(data.optionVariants || [])
				if (optIds.length != expectedOptions.n) {
					return c.json({ message: "Not all options (or too many) given" }, 400)
				}
				const variantIds = Object.values(data.optionVariants || [])

				const options = await tx
					.select()
					.from(shopItemOptions)
					.where(inArray(shopItemOptions.id, optIds))
				if (options.length != expectedOptions.n) {
					return c.json({ message: "Not all options exist" }, 400)
				}

				const validOptions = !options.some(opt => opt.itemId != item.id)
				if (!validOptions) {
					return c.json({ message: "Some options do not correspond to the item to be ordered" }, 400)
				}

				const variants = await db
					.select({
						...getTableColumns(itemVariants),
						additionalPrice: regionalItemVariantAvailabilities.price
					})
					.from(itemVariants)
					.innerJoin(regionalItemVariantAvailabilities, and(
						eq(regionalItemVariantAvailabilities.regionId, region.id),
						eq(regionalItemVariantAvailabilities.variantId, itemVariants.id)
					))
					.where(inArray(itemVariants.id, variantIds))
				if (variants.length != expectedOptions.n) {
					return c.json({ message: "Not all variants exist" }, 400)
				}

				const validVariants = !variants.some(variant => (
					!data.optionVariants ||
					data.optionVariants[variant.optionId] != variant.id
				))
				if (!validVariants) {
					return c.json({ message: "Some variants are not valid" }, 400)
				}

				const variantCost: number = variants.reduce((acc, curr) => curr.additionalPrice + acc, 0)
				const cost = (item.price + variantCost) * data.quantity

				const [u] = await tx.select().from(users).where(eq(users.id, user.id))
				if (!u) {
					return c.json({ message: "User not found" }, 404)
				}
				if (u.coins < cost) {
					return c.json({ message: "Order too expensive" }, 400)
				}

				const [placedOrder] = await tx
					.insert(shopOrders)
					.values({
						quantity: data.quantity,
						userId: u.id,
						itemId: item.id,
						addressId: address.id,
						price: cost
					}).returning()
				if (!placedOrder) {
					logger.error({ userId: user.id, data, cost, item, variants }, "Couldnt place order")
					tx.rollback()
					return c.json({ message: "Something went wrong" }, 500)
				}

				const opts = Object.entries(data.optionVariants || {})
					.map(([optionId, variantId]) => ({ optionId, variantId, orderId: placedOrder.id }))
				if (opts.length !== 0) {
					const selection = await tx.insert(orderVariantSelection).values(opts).returning()
					if (selection.length == 0) {
						logger.error({ userId: user.id, data, cost, item, variants, placedOrder }, "Couldnt make variant selection")
						tx.rollback()
						return c.json({ message: "Something went wrong" }, 500)
					}
				}

				await tx.update(users).set({ coins: u.coins - cost }).where(eq(users.id, u.id))
				if (item.quantity) {
					await tx
						.update(regionalItemAvailabilities)
						.set({ quantity: item.quantity - placedOrder.quantity })
						.where(and(
							eq(regionalItemAvailabilities.regionId, region.id),
							eq(regionalItemAvailabilities.itemId, item.id)
						))
				}

				return c.json({ order: placedOrder }, 201)
			})
		})
	.get(
		"/:orderId",
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
		"/",
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
