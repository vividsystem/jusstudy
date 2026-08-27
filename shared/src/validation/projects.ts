import { projectCategoryValues } from "@server/db/schema"
import z from "zod"


export const projectSchema = z.object({
	id: z.uuid(),
	createdAt: z.date(),
	name: z.string().nonempty(),
	description: z.string().nullable(),
	demoLink: z.string().nullable(),
	repository: z.string(),
	readmeLink: z.string().nullable(),
	category: z.enum(projectCategoryValues),
	totalTime: z.number().nonnegative(),
	creatorId: z.string().nonempty()
})


export const projectLockSchema = z.object({
	projectId: z.uuid(),
	shipId: z.uuid(),
	lockedAt: z.date(),
	unlockedAt: z.date().nullable()
})

export type Project = z.infer<typeof projectSchema>
export type ProjectLock = z.infer<typeof projectLockSchema>

export const HackatimeLinkRequestSchema = z.object({
	id: z.string().nonempty()
})

export const NewProjectRequestSchema = projectSchema.omit({
	id: true,
	creatorId: true,
	createdAt: true,
	totalTime: true
})

export const NewProjectResponseSchema = z.object({
	project: projectSchema,
})

export const UpdateProjectRequestSchema = NewProjectRequestSchema.partial().strip()
export const UpdateProjectResponseSchema = z.object({
	updatedProject: projectSchema
})

export const ProjectsResponseSchema = z.object({
	devlogs: z.array(projectSchema)
})

export const LocksResponseSchema = z.object({
	locks: z.array(projectLockSchema)
})

export const ProjectByIdResponseSchema = z.object({
	project: projectSchema.extend({
		unloggedTime: z.number().nonnegative().nullable()
	})
})

export const LocksByProjectIdResponseSchema = LocksResponseSchema

export const ActiveProjectLockResponseSchema = z.object({ lock: projectLockSchema })

