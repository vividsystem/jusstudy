import { reviewTypeValues } from "@server/db/schema";
import z from "zod";

export const NewReviewSchema = z.object({
	passed: z.boolean(),
	comment: z.string().nonempty(),
	note: z.string().nonempty().optional(),
	type: z.enum(reviewTypeValues)
})
