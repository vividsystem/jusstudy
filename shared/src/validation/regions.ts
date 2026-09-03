import { z } from "zod";

export const shopRegionSchema = z.object({
	id: z.uuid(),
	name: z.string().nonempty()
})

export type ShopRegion = z.infer<typeof shopRegionSchema>

export const regionalItemAvailabilitySchema = z.object({
	regionId: z.uuid(),
	itemId: z.uuid(),
	createdAt: z.date(),
	available: z.boolean(),
	quantity: z.number().nonnegative().nullable(),
	price: z.number().positive()
})

export type RegionalItemAvailability = z.infer<typeof regionalItemAvailabilitySchema>

export const regionalVariantAvailabilitySchema = z.object({
	variantId: z.uuid(),
	regionId: z.uuid(),
	price: z.number().nonnegative()
})

export const RegionsResponseSchemma = z.object({
	regions: z.array(shopRegionSchema)
})

export const RegionsByIdResponseSchema = z.object({
	region: shopRegionSchema
})

export const NewRegionRequestSchema = shopRegionSchema.omit({ id: true })
export const NewRegionResponseSchema = RegionsByIdResponseSchema


export const AddRegionAvailabilityToItemRequestSchema = regionalItemAvailabilitySchema.omit({
	itemId: true,
	createdAt: true
})

export type AddRegionAvailability = z.infer<typeof AddRegionAvailabilityToItemRequestSchema>

export const AddRegionAvailabilityToVariantRequestSchema = regionalVariantAvailabilitySchema.omit({ variantId: true })
export type AddVariantRegionAvailability = z.infer<typeof AddRegionAvailabilityToVariantRequestSchema>

export const RegionalAvailabilitiesByItemResponseSchema = z.object({
	availabilities: z.array(regionalItemAvailabilitySchema)
})
