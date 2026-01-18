import z from "zod"
import type { LanguageSchema, ProjectDetailsResponseSchema, ProjectSchema, StatsResponseSchema, StatsSchema } from "./validation"

export type Stats = z.infer<typeof StatsSchema>
export type Language = z.infer<typeof LanguageSchema>
export type Project = z.infer<typeof ProjectSchema>
export type StatsResponse = z.infer<typeof StatsResponseSchema>
export type ProjectDetailsResponse = z.infer<typeof ProjectDetailsResponseSchema>
