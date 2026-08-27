import z from "zod"

export const addressSchema = z.object({
	id: z.uuid(),
	firstname: z.string().nonempty(),
	lastname: z.string().nonempty(),
	address_first_line: z.string().nonempty(),
	address_second_line: z.string().optional(),
	city: z.string().nonempty(),
	state: z.string().nonempty(),
	postal_code: z.string().nonempty(),
	country: z.string().nonempty(),
	userId: z.string().nonempty()
})


export const NewAddressRequestSchema = addressSchema.omit({
	userId: true
})

export const NewAddressResponseSchema = z.object({
	address: addressSchema
})

export const AddressesResponseSchema = z.object({
	addresses: z.array(addressSchema)
})
