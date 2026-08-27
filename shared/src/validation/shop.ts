import z from "zod";

export const itemOptionSchema = z.object({
	id: z.uuid(),
	name: z.string().nonempty(),
	itemId: z.uuid()
})

export const optionVariantSchema = z.object({
	id: z.uuid(),
	name: z.string().nonoptional(),
	additionalPrice: z.number().nonnegative(),
	optionId: z.uuid()
})

export const NewVariantRequest = optionVariantSchema.omit({
	id: true,
	optionId: true
})

export const NewOptionRequest = z.object({
	name: z.string().nonempty(),
	variants: z.array(NewVariantRequest).nonempty()
})

export const shopItemSchema = z.object({
	id: z.uuid(),
	createdAt: z.date(),
	name: z.string().nonempty(),
	description: z.string().nonempty(),
	image: z.url().nullable(),
	basePrice: z.number().positive(),
	quantity: z.number().nonnegative().nullable(),
})

export const NewShopItemRequest = shopItemSchema.omit({ id: true, createdAt: true }).extend({
	options: z.array(NewOptionRequest).optional()
})

export const NewShopItemResponse = z.object({
	shopItem: shopItemSchema,
	options: z.array(itemOptionSchema).nullable(),
	variants: z.array(optionVariantSchema).nullable()
})

export const ShopItemsResponseSchema = z.object({
	items: z.array(shopItemSchema)
})


export const optionWithVariants = itemOptionSchema.extend({
	variants: z.array(optionVariantSchema)
})
export const NewOptionResponseSchema = z.object({
	option: optionWithVariants
})

export const ShopItemByIdResponseSchema = z.object({
	item: shopItemSchema.extend({
		options: z.array(optionWithVariants)
	})
})


export const NewVariantResponseSchema = z.object({
	variant: optionVariantSchema
})

export const UpdateShopItemRequest = NewShopItemRequest.extend({
	quantity: z.number().positive().nullable(), // set to positive
}).partial().strip()

export const UpdateShopItemResponseSchema = z.object({
	item: shopItemSchema
})


export const PlaceOrderRequest = z.object({
	itemId: z.uuid().nonempty(),
	optionVariants: z.record(z.uuid(), z.uuid()).optional(), // option uuid: variant uuid

	quantity: z.number().positive(),
	addressId: z.uuid().nonempty(),
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
