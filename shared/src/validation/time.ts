import { z } from "zod"
import { entryTypes } from "@server/db/schema";

export const timeEntrySchema = z.object({
	duration: z.number(),
	id: z.uuid(),
	createdAt: z.date(),
	type: z.enum(entryTypes),
	projectId: z.uuid(),
	timeAnchor: z.number().nonnegative(),
	createdBy: z.string().nonempty(),
})

export type TimeEntry = z.infer<typeof timeEntrySchema>
