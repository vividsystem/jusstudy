import z from "zod";
import { projectSchema } from "./projects";
import { projectShipSchema } from "./ships";


export const reviewSchema = z.object({
	createdAt: z.date(),
	shipId: z.uuid(),
	passed: z.boolean(),
	comment: z.string().nonempty(),
	note: z.string().nullable(),
	reviewerId: z.string(),
})

export const NewReviewSchema = z.object({
	passed: z.boolean(),
	comment: z.string().nonempty(),
	note: z.string().optional(),
})

export const LockReviewSchema = z.object({
	comment: z.string().nonempty(),
	note: z.string().optional(),
})


export const PendingShipsResponseSchema = z.object({
	projects: projectSchema,
	project_ships: projectShipSchema,
	timeShipped: z.number().nonnegative()
})

export const ProjectReviewsResponseSchema = z.object({
	reviews: z.array(reviewSchema)
})

export const ShipReviewsResponseSchema = ProjectReviewsResponseSchema
