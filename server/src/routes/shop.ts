import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { NewShopItemRequest, PlaceOrderRequest, UpdateShopItemRequest } from "@shared/validation/shop"
import db from "@server/db";
import { addresses, shopItems, shopOrders, users } from "@server/db/schema";
import { asc, eq, getTableColumns } from "drizzle-orm";
import type { Env } from "..";


export const shopRoute = new Hono<Env>()
	.post("/items", zValidator("json", NewShopItemRequest), async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)
		if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

		const data = c.req.valid("json")


		const newItems = await db.insert(shopItems).values({ ...data }).returning()
		if (newItems.length == 0) {
			logger.error({ userId: user.id, data })
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ shopItem: newItems[0]! }, 201)
	})
	.get("/items", async (c) => {
		const items = await db.select().from(shopItems).orderBy(asc(shopItems.price))


		return c.json({ shopItems: items }, 200)
	})
	.get("/items/:itemId", async (c) => {
		const itemId = c.req.param("itemId")
		const item = await db.select().from(shopItems).where(eq(shopItems.id, itemId))
		if (item.length == 0) {
			return c.json({ message: "Not found" }, 404)
		}

		return c.json({ item: item[0]! }, 200)
	})
	.post("/items/:itemId/retire", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)
		if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

		const itemId = c.req.param("itemId")


		const [item] = await db.select().from(shopItems).where(eq(shopItems.id, itemId))
		if (!item) {
			return c.json({ message: "Item not found" }, 404)
		}

		await db.update(shopItems).set({ quantity: 0 }).where(eq(shopItems.id, itemId))

		return c.json({ message: "Shop successfully taken out of the shop" }, 200)
	})

	.patch("/items/:itemId", zValidator("json", UpdateShopItemRequest), async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)
		if (user.type != "admin") return c.json({ message: "Forbidden" }, 403)

		const itemId = c.req.param("itemId")
		const data = c.req.valid("json")

		const [item] = await db.update(shopItems).set({ ...data }).where(eq(shopItems.id, itemId)).returning()
		if (!item) {
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ message: "Item updated", item: item }, 200)
	})
	.post("/orders", zValidator("json", PlaceOrderRequest), async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)
		if (user.banned || !user.yswsEligible) return c.json({ message: "Forbidden" }, 403)

		const data = c.req.valid("json")

		const address = await db.select().from(addresses).where(eq(addresses.id, data.addressId))
		if (address.length == 0) {
			return c.json({ message: "Address not found" }, 404)
		} else if (address[0]!.userId != user.id) {
			return c.json({ message: "You are not allowed to place orders to addresses that are owned by others" }, 403)
		}

		const res = await db.select().from(shopItems).where(eq(shopItems.id, data.itemId))
		if (res.length == 0) {
			return c.json({ message: "Item not found" }, 404)
		}
		const itemToOrder = res[0]!

		const cost = itemToOrder.price * data.quantity

		if (user.coins < cost) {
			return c.json({ message: "Order too expensive" }, 400)
		}

		return await db.transaction(async (tx) => {

			await tx.update(users).set({ coins: user.coins - cost }).where(eq(users.id, user.id))

			const placedOrder = await tx.insert(shopOrders).values({ ...data, userId: user.id }).returning()
			if (placedOrder.length == 0) {
				logger.error({ userId: user.id, data, cost, itemToOrder }, "Couldnt place order")
				return c.json({ message: "Something went wrong" }, 500)
			}


			return c.json({ order: placedOrder[0]! }, 201)
		})

	})
	.get("/orders/:orderId", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)
		const orderId = c.req.param("orderId")


		const { addressId, orderNotes, ...rest } = getTableColumns(shopOrders)
		const order = await db.select(rest).from(shopOrders).where(eq(shopOrders.id, orderId))
		if (order.length == 0) {
			return c.json({ message: "Order not found" }, 404)
		} else if (order[0]!.userId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}

		return c.json({ order: order[0]! }, 200)
	})
	.get("/orders", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const { addressId, orderNotes, ...rest } = getTableColumns(shopOrders)
		const orders = await db.select(rest).from(shopOrders).where(eq(shopOrders.userId, user.id))

		return c.json({ orders: orders }, 200)
	})
