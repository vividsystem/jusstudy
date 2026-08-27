import type { Transaction } from "@server/db"
import { joeFraudReviews, projects, timeHackatimeLinks, users } from "@server/db/schema"
import { eq } from "drizzle-orm"

interface FraudRequestBody {
	name: string
	codeLink: string
	demoLink?: string
	submitter: {
		slackId: string
	} | {
		hackatimeId: string
	} | {
		email: string
	}
	hackatimeProjects: string[]
	organizerPlatformId?: string
}
export async function postFraudReviewRequest(body: FraudRequestBody) {
	const res = await fetch(`https://joe.fraud.hackclub.com/api/v1/ysws/events/${process.env.JOE_EVENT_ID!}/projects`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${process.env.JOE_API_KEY!}`
		},
		body: JSON.stringify(body)
	})
	if (!res.ok) {
		throw new Error(`Failed posting fraud review with status ${res.status}`)
	}

	return await res.json() as {
		id: string, // uuid
		status: string,
		message: string
	}
}


export async function requestFraudReview(shipId: string, projectId: string, tx: Transaction) {
	const [fraudReviewInfo] = await tx.select({
		submitter: {
			slackId: users.slackId
		},
		name: projects.name,
		codeLink: projects.repository,
		demoLink: projects.demoLink,
	}).from(projects)
		.innerJoin(users, eq(users.id, projects.creatorId))
		.where(eq(projects.id, projectId))
	if (!fraudReviewInfo) {
		return { ok: false }
	}

	const hackatimeProjects = await tx
		.select({ hackatimeProject: timeHackatimeLinks.hackatimeProjectName })
		.from(timeHackatimeLinks)
		.where(eq(timeHackatimeLinks.projectId, projectId))
	if (hackatimeProjects.length == 0) {
		return { ok: false }
	}

	try {
		const res = await postFraudReviewRequest({
			...fraudReviewInfo,
			demoLink: fraudReviewInfo.demoLink || undefined,
			hackatimeProjects: hackatimeProjects.map(p => p.hackatimeProject)
		})

		await tx.insert(joeFraudReviews).values({
			shipId: shipId,
			joeProjectId: res.id
		})

		return { ok: true }
	} catch (e) {
		return { ok: false }
	}

}
