import { projectCategoryValues } from "@server/db/schema"
import z from "zod"

export const HackatimeLinkRequestSchema = z.object({
	id: z.string().nonempty()
})

export const NewProjectRequestSchema = z.object({
	name: z.string().nonempty(),
	description: z.string().nonempty().optional(),
	demoLink: z.url().optional(),
	repository: z.url().optional(),
	readmeLink: z.url().optional(),
	category: z.enum(projectCategoryValues)
}).strip()

export const UpdateProjectRequestSchema = NewProjectRequestSchema.partial().strip()
