import z from "zod"

export const TimeableSchema = z.object({
	name: z.string().nonempty(),
	totalSeconds: z.number().positive(),
	text: z.string().nonempty(), // human readable time spend
	hours: z.number().positive(),
	minutes: z.number().positive(),
	seconds: z.number().positive(),
	digital: z.string().nonempty() // hh:mm:ss
})

export const LanguageSchema = TimeableSchema.extend({})
export const ProjectSchema = TimeableSchema.extend({})


export const TrustFactorSchema = z.object({
	trust_level: z.enum(["green", "blue", "red"]),
	trust_value: z.number().positive()
})

export const StatsSchema = z.object({
	user: z.string().nonempty(),
	user_id: z.string().nonempty(),
	is_coding_activity_visible: z.boolean(),
	is_other_usage_visible: z.boolean(),
	status: z.string().nonempty(), // "ok",...
	start: z.iso.datetime(),
	end: z.iso.datetime(),
	range: z.string().nonempty(),
	human_readable_range: z.string().nonempty(),
	total_seconds: z.number().positive(),
	daily_average: z.number().positive(),
	human_readable_total: z.string(),
	human_readable_daily_average: z.string().nonempty(),
	languages: z.optional(z.array(LanguageSchema)),
	projects: z.optional(z.array(ProjectSchema)),
	trust_factor: TrustFactorSchema
})

export const StatsResponseSchema = z.discriminatedUnion('success', [
	z.object({ success: z.literal(true), data: StatsSchema }),
	z.object({ success: z.literal(false), error: z.string() })
])
