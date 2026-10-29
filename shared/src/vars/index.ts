export const MAX_FILE_SIZE = 100 * 1024 * 1024;

export const userTypeValues = ["participant", "reviewer", "fraud", "admin"] as const

export const projectCategoryValues = ["CAD", "Game Development", "Web Development", "PCB Design", "App Development", "Desktop App Development"] as const

export const shipStatusValues = ["pre-initial", "voting", "pre-fraud", "failed", "pre-payout", "finished"] as const

export const timeEntryTypeValues = ["devlog", "manual", "htlink"] as const
