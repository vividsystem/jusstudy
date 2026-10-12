import type { QueryObject } from "@server/db"
import { joeFraudReviews, projects, timeHackatimeLinks, users } from "@server/db/schema"
import { eq } from "drizzle-orm"
import { ENV } from "./config"
import { externalTracer, withSpan } from "."
import { fraudReviewFailures } from "./metrics"
import { SpanKind } from "@opentelemetry/api"

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

export class FraudReviewResponseError extends Error {
	readonly res: Response
	constructor(res: Response) {
		super("Failed posting fraud review");
		this.name = "FraudReviewResponseError";
		this.res = res
		Object.setPrototypeOf(this, FraudReviewResponseError.prototype);
	}
}

export async function postFraudReviewRequest(body: FraudRequestBody) {
	return withSpan(externalTracer, SpanKind.CLIENT, "post_fraud_request", async (span) => {
		const res = await fetch(`https://joe.fraud.hackclub.com/api/v1/ysws/events/${ENV.JOE_EVENT_ID!}/projects`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${ENV.JOE_API_KEY!}`
			},
			body: JSON.stringify(body)
		})
		span.setAttributes({
			"project.name": body.name,
			"project.codeLink": body.codeLink,
			"peer.service": "joe",
			"http.response.status_code": res.status
		})

		if (!res.ok) {
			fraudReviewFailures.add(1, { reason: "http" })
			throw new FraudReviewResponseError(res)
		}

		return await res.json() as {
			id: string, // uuid
			status: string,
			message: string
		}
	})
}


export async function requestFraudReview(shipId: string, projectId: string, tx: QueryObject) {
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
		fraudReviewFailures.add(1, { reason: "missing_info" })
		throw new Error("Could not get fraud review info")
	}

	const hackatimeProjects = await tx
		.select({ hackatimeProject: timeHackatimeLinks.hackatimeProjectName })
		.from(timeHackatimeLinks)
		.where(eq(timeHackatimeLinks.projectId, projectId))
	if (hackatimeProjects.length == 0) {
		fraudReviewFailures.add(1, { reason: "no_hackatime_links" })
		throw new Error("No linked hackatime projects")
	}

	const res = await postFraudReviewRequest({
		...fraudReviewInfo,
		demoLink: fraudReviewInfo.demoLink || undefined,
		hackatimeProjects: hackatimeProjects.map(p => p.hackatimeProject),
		organizerPlatformId: shipId
	})

	await tx.insert(joeFraudReviews).values({
		shipId: shipId,
		joeProjectId: res.id
	})
}
