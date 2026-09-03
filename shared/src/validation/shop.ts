import z from "zod";
import { regionalItemAvailabilitySchema } from "./regions";


export const shopItemSchema = z.object({
	id: z.uuid(),
	createdAt: z.date(),
	name: z.string().nonempty(),
	description: z.string().nonempty(),
	image: z.url().nullable(),
})

export type ShopItem = z.infer<typeof shopItemSchema>

export const itemOptionSchema = z.object({
	id: z.uuid(),
	name: z.string().nonempty(),
	itemId: z.uuid()
})

export type ItemOption = z.infer<typeof itemOptionSchema>

export const optionVariantSchema = z.object({
	id: z.uuid(),
	name: z.string().nonoptional(),
	optionId: z.uuid()
})

export const optionVariantWithPrices = optionVariantSchema.extend({
	prices: z.record(z.uuid(), z.number().nonnegative())
})

export type OptionVariantWithPrices = z.infer<typeof optionVariantWithPrices>

export const NewVariantRequestSchema = optionVariantWithPrices.omit({
	id: true,
	optionId: true,
})
export type NewVariantRequest = z.infer<typeof NewVariantRequestSchema>

export const NewVariantResponseSchema = z.object({
	variant: optionVariantSchema
})

export const NewOptionRequestSchema = z.object({
	name: z.string().nonempty(),
	variants: z.array(NewVariantRequestSchema).nonempty()
})

export type NewOptionRequest = z.infer<typeof NewOptionRequestSchema>

export const optionWithVariants = itemOptionSchema.extend({
	variants: z.array(optionVariantSchema)
})

export type ItemOptionWithVariants = z.infer<typeof optionWithVariants>

export const optionWithVariantsPrices = itemOptionSchema.extend({
	variants: z.array(optionVariantWithPrices)
})

export type ItemOptionWithVariantsPrices = z.infer<typeof optionWithVariantsPrices>

export const NewOptionResponseSchema = z.object({
	option: itemOptionSchema
})


export const NewShopItemRequestSchema = shopItemSchema.omit({ id: true, createdAt: true }).extend({
	regions: z.record(z.uuid(), regionalItemAvailabilitySchema.omit({ createdAt: true, itemId: true, regionId: true })),
	options: z.array(NewOptionRequestSchema).optional()
})

export type NewShopItemRequest = z.infer<typeof NewShopItemRequestSchema>

export const NewShopItemResponse = z.object({
	shopItem: shopItemSchema,

	options: z.array(itemOptionSchema).nullable(),
	variants: z.array(optionVariantSchema).nullable()
})

export const ShopItemsResponseSchema = z.object({
	items: z.array(z.union([
		shopItemSchema,
		shopItemSchema.extend({
			prices: z.array(regionalItemAvailabilitySchema)
		})
	]))
})

export const shopItemWithOptions = shopItemSchema.extend({
	options: z.array(optionWithVariants)
})
export type ShopItemWithOptions = z.infer<typeof shopItemWithOptions>

export const shopItemWithOptionsPrices = shopItemSchema.extend({
	options: z.array(optionWithVariantsPrices)
})

export type ShopItemWithOptionsPrices = z.infer<typeof shopItemWithOptionsPrices>

export const ShopItemByIdResponseSchema = z.object({
	item: shopItemWithOptionsPrices
})

export const UpdateShopItemRequest = shopItemSchema.omit({ id: true, createdAt: true }).partial().strip()

export const UpdateShopItemResponseSchema = z.object({
	item: shopItemSchema
})

export const RegionalItemsResponseSchema = z.object({
	items: shopItemSchema.extend({
		regionalItemAvailabilitySchema,
		available: z.boolean(),
		quantity: z.number().nonnegative().nullable(),
		price: z.number().positive(),
		availableSince: z.date()
	})
})
