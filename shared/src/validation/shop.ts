import z from "zod";

export const NewVariantRequest = z.object({
	name: z.string().nonempty(),
	additionalPrice: z.number().nonnegative().optional()
})

export const NewOptionRequest = z.object({
	name: z.string().nonempty(),
	variants: z.array(NewVariantRequest).nonempty()
})

export const NewShopItemRequest = z.object({
	name: z.string().nonempty(),
	description: z.string().nonempty(),
	basePrice: z.number().positive(),
	quantity: z.number().positive().optional(),
	image: z.url().optional(),
	options: z.array(NewOptionRequest).optional()
})


export const UpdateShopItemRequest = NewShopItemRequest.extend({
	quantity: z.number().positive().nullable(),
	image: z.url().nullable()
}).partial().strip()

export const PlaceOrderRequest = z.object({
	itemId: z.uuid().nonempty(),
	optionVariants: z.record(z.uuid(), z.uuid()).optional(), // option uuid: variant uuid

	quantity: z.number().positive(),
	addressId: z.uuid().nonempty(),
	orderNotes: z.string().optional()
})
