import { typeValues } from "@server/db/schema";
import z from "zod";
import { orderSchema } from "./orders";
import { projectSchema } from "./projects";
import { devlogSchema } from "./devlogs";


export const userSchema = z.object({
	id: z.string().nonempty(),
	name: z.string().nonempty(),
	email: z.email(),
	emailVerified: z.boolean(),
	yswsEligible: z.boolean(),
	verificationStatus: z.string().nonempty(),
	nickname: z.string().nonempty(),
	slackId: z.string().nonempty(),
	type: z.enum(typeValues),
	image: z.url().nullable(),
	//searchColumn
})

export const userSafeSchema = userSchema.omit({
	email: true, name: true, emailVerified: true, yswsEligible: true, verificationStatus: true
})


export const userStatsSchema = z.object({
	userId: z.string().nonempty(),
	votesCast: z.number().nonnegative()
})


export const UserStatsResponseSchema = z.object({
	stats: userStatsSchema
})

export const UserStatsByIdResponseSchema = userStatsSchema.extend({
	nProjects: z.number().nonnegative(),
	nDevlogs: z.number().nonnegative(),
	nShips: z.number().nonnegative(),
})


export const HackatimeProjectResponseSchema = z.object({
	used: z.array(z.string().nonempty()),
	unused: z.array(z.string().nonempty())
})

export const UserSearchResponseSchema = z.object({
	results: z.array(userSafeSchema.extend({ rank: z.number().nonnegative() })),
	query: z.string()
})

export const BanUserResponseSchema = z.object({
	message: z.literal("User successfully banned!"),
	alreadyFulfilledOrders: z.array(orderSchema)
})

export const UserByIdResponseSchema = z.object({
	user: z.union([userSafeSchema, userSchema])
})

export const UserProjectsResponseSchema = z.object({
	userProjects: z.array(projectSchema)
})

export const UserDevlogsResponseSchema = z.object({
	devlogs: z.array(devlogSchema)
})
