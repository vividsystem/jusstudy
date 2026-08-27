import z from "zod";
import { projectSchema } from "./projects";


export const shortUserInfo = z.object({
	id: z.string(),
	name: z.string(),
	avatar: z.url().nullable(),
})

export const rankedProjectSchema = projectSchema.extend({
	position: z.number().nonnegative(),
	mu: z.number(),
	sigma: z.number(),
	ordinal: z.number(),
	matchups: z.number().nonnegative(),
	creator: shortUserInfo
})


export type RankedProject = z.infer<typeof rankedProjectSchema>

export const RankingProjectsResponseSchema = z.object({
	ranking: z.array(rankedProjectSchema)
})


export const rankedUsers = z.object({
	position: z.number().nonnegative(),
	avgOrdinals: z.string(),
	nProjects: z.number().nonnegative(),
	matchups: z.number().nonnegative(),
	userScore: z.number(),
	creator: shortUserInfo
})

export const RankingUsersResponseSchema = z.object({
	ranking: z.array(rankedUsers)
})
