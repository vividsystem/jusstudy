import z from "zod";

export const rating = z.object({
	projectId: z.uuid(),
	technicality: z.number().min(0).max(5),
	documentation: z.number().min(0).max(5),
	creativity: z.number().min(0).max(5),
	implementation: z.number().min(0).max(5),
})

export const publishVoteSchema = z.object({
	ratings: z.array(rating).length(4)
})
