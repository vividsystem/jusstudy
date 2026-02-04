import z from "zod"

export const NewAddressSchema = z.object({
	firstname: z.string().nonempty(),
	lastname: z.string().nonempty(),
	address_first_line: z.string().nonempty(),
	address_second_line: z.string().optional(),
	city: z.string().nonempty(),
	state: z.string().nonempty(),
	postal_code: z.string().nonempty(),
	country: z.string().nonempty()
})
