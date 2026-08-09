import z from "zod";

export const NewReviewSchema = z.object({
	passed: z.boolean(),
	comment: z.string().nonempty(),
	note: z.string().optional(),
	timeRemoved: z.number().int().nonnegative().default(0),
	timeRemovalReason: z.string().optional(),
}).refine((data) => data.timeRemoved === 0 || (data.timeRemovalReason?.trim().length ?? 0) > 0, {
	message: "A reason is required when removing hours",
	path: ["timeRemovalReason"],
})
