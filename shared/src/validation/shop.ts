import z from "zod";

export const NewShopItemRequest = z.object({
	name: z.string().nonempty(),
	description: z.string().nonempty(),
	price: z.number().positive(),
	quantity: z.number().positive().optional(),
	image: z.url().optional()
})

export const PlaceOrderRequest = z.object({
	itemId: z.uuid().nonempty(),
	quantity: z.number().positive(),
	addressId: z.uuid().nonempty(),
	orderNotes: z.string().optional()
})
