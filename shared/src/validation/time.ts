import { z } from "zod"
import { timeEntryTypeValues } from "@shared/vars";

export const timeEntrySchema = z.object({
	duration: z.number(),
	id: z.uuid(),
	createdAt: z.date(),
	type: z.enum(timeEntryTypeValues),
	projectId: z.uuid(),
	timeAnchor: z.number().nonnegative(),
	createdBy: z.string().nonempty(),
})

export type TimeEntry = z.infer<typeof timeEntrySchema>
