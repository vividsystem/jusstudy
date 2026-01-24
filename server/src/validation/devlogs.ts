import z from "zod";

export const NewDevlogRequestSchema = z.object({
	content: z.string().min(100)
})
