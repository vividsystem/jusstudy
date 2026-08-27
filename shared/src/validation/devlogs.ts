import z from "zod";

export const devlogSchema = z.object({
	id: z.uuid(),
	content: z.string().min(100),
	createdAt: z.date(),
	projectId: z.uuid(),
	timeEntryId: z.uuid()
})

export type Devlog = z.infer<typeof devlogSchema>

export const attachmentSchema = z.object({
	createdAt: z.date(),
	cdnURL: z.url(),
	devlogId: z.uuid()
})

export type Attachment = z.infer<typeof attachmentSchema>

export const NewDevlogRequestSchema = z.object({
	content: z.string().min(100)
})


export const NewDevlogResponseSchema = z.object({
	devlog: devlogSchema
})

export const DevlogResponseSchema = z.object({
	devlog: devlogSchema.omit({ timeEntryId: true }).extend({
		timeLogged: z.number().nonnegative(),
		attachments: z.array(attachmentSchema)
	})
})
