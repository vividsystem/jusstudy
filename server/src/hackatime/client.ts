import hackatime from "."
interface HTLink {
	hackatimeProjectId: unknown
	[x: string]: unknown
}
interface ProjectWithHackatime {
	id: string
	hackatimeLinks: HTLink[]
	[x: string]: unknown
}

export async function sortedUserProjectTimes(slackId: string, res: ProjectWithHackatime[]): Promise<{
	ok: true,
	timeRec: Record<string, number>
} | { ok: false }> {
	const stats = await hackatime.userStats(slackId, {
		startDate: new Date(process.env.START_DATE!),
		features: ["projects"]
	})

	if (!stats.success) {
		return { ok: false }
	}


	// to calc logged time in the future maybe make an aggregate function to sum up time each devlog
	let timeRecord: Record<string, number> = {}
	for (let project of res) {
		const ids = project.hackatimeLinks.map((l) => l.hackatimeProjectId)

		// sum time spent up
		timeRecord[project.id] = stats.data.projects!
			.filter(p => ids.includes(p.name))
			.reduce((acc, p) => {
				acc += p.total_seconds;
				return acc;
			}, timeRecord[project.id] ?? 0);
	}

	return { ok: true, timeRec: timeRecord }

}

export async function singleProjectTime(slackId: string, links: HTLink[]): Promise<{ ok: true, time: number } | { ok: false }> {
	const stats = await hackatime.userProjectDetails(slackId)
	if (!stats.success) {
		return { ok: false }
	}

	const linksArray = links.map(l => l.hackatimeProjectId)


	let time = 0
	stats.projects.filter(p => linksArray.includes(p.name)).forEach(p => {
		time += p.total_seconds
	})

	return { ok: true, time }
}
