import z from "zod";

export const NewReviewSchema = z.object({
	passed: z.boolean(),
	comment: z.string().nonempty(),
	note: z.string().optional(),
})

export const LockReviewSchema = z.object({
	comment: z.string().nonempty(),
	note: z.string().optional(),
})
