import { z } from "zod";
export const PlaceOrderRequest = z.object({
	itemId: z.uuid().nonempty(),
	optionVariants: z.record(z.uuid(), z.uuid()).optional(), // option uuid: variant uuid

	quantity: z.number().positive(),
	addressId: z.uuid().nonempty(),
	regionId: z.uuid().nonempty(),
	orderNotes: z.string().optional()
})

export const orderSchema = z.object({
	id: z.uuid(),
	quantity: z.number().positive(),
	userId: z.string().nonempty(),
	placedAt: z.date(),
	fulfilledAt: z.date().nullable(),
	itemId: z.uuid(),
	addressId: z.uuid(),
	price: z.number().positive(),
	trackingId: z.string().nonempty().nullable(),
	orderNotes: z.string().nonempty().nullable()

})

export const PlaceOrderResponseSchema = z.object({
	order: orderSchema
})

export const OrderByIdResponseSchema = PlaceOrderResponseSchema
export const UserOrdersResponseSchema = z.object({
	orders: z.array(orderSchema)
})
