import z from "zod";
import { projectSchema } from "./projects";


export const votingRoundSchema = z.object({
	id: z.uuid(),
	createdAt: z.date(),
	completedAt: z.date().nullable(),
	voterId: z.string().nonempty(),
})

export const rating = z.object({
	createdAt: z.date(),
	roundId: z.uuid(),
	projectId: z.uuid(),
	technicality: z.number().min(0).max(5),
	documentation: z.number().min(0).max(5),
	creativity: z.number().min(0).max(5),
	implementation: z.number().min(0).max(5),
	feedback: z.string().nonempty()
})

export const PublishVoteRequestSchema = z.object({
	ratings: z.array(rating.omit({ createdAt: true, roundId: true })).length(4)
})

export const ProjectRatingsResponseSchema = z.object({
	ratings: z.array(rating)
})

export const AlreadyExistingSessionResponseSchema = z.object({
	message: z.literal("A session already exists"),
	existing: votingRoundSchema
})

export const NewVoteRoundResponseSchema = z.object({
	projects: z.array(
		projectSchema.extend({
			timeSpent: z.number().nonnegative(),
			position: z.number().min(1).max(4)
		})
	).length(4),
	round: votingRoundSchema
})

export const ActiveRoundResponseSchema = NewVoteRoundResponseSchema
