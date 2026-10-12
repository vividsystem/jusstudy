import { SpanKind, SpanStatusCode } from "@opentelemetry/api"
import { ENV } from "./config"
import { externalTracer, withSpan } from "."
import { externalServiceFailures } from "./metrics"

// https://fastapi.tiangolo.com/tutorial/handling-errors/#the-resulting-response
interface BotErrorType {
	detail: string
}

interface NotsResponse {
	ok: true,
	channel: string
	ts: string // some wheird floating point timestamp id combo?
}

interface SpanConfig {
	spanName: string,
	attributes?: Record<string, number | boolean | string | undefined>
}

async function makeRequest<V>(path: string, spanCfg: SpanConfig, body: V): Promise<NotsResponse | { ok: false } & BotErrorType> {
	return await withSpan(externalTracer, SpanKind.CLIENT, spanCfg.spanName, async (span) => {
		if (spanCfg.attributes) {
			span.setAttributes(spanCfg.attributes)
		}
		const url = new URL(path, ENV.BOT_HOST)
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${ENV.BOT_ACCESS_TOKEN}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		})
		span.setAttributes({ "peer.service": "slack", "http.response.status_code": res.status })
		if (!res.ok) {
			const data = await res.json() as BotErrorType
			span.setStatus({ code: SpanStatusCode.ERROR })
			span.setAttribute("response.errorDetail", data.detail)
			externalServiceFailures.add(1, { service: "emi", operation: path })
			return { ...data, ok: false } as { ok: false } & BotErrorType
		}

		const data = await res.json() as NotsResponse

		span.setStatus({ code: SpanStatusCode.OK })
		return data
	})
}

function createProjectLink(projectId: string) {
	return new URL(`/projects/${projectId}`, ENV.CLIENT_URL).toString()
}

function createCurrencyMessage(coins: number) {
	return `${coins} ${coins < 2 ? "Book" : "Books"}`
}

interface NotsShipCreateRequestBody {
	slackUserId: string,
	projectId: string,
	projectName: string,
}
export async function notifyShipCreate(b: NotsShipCreateRequestBody) {
	const spanCfg: SpanConfig = {
		spanName: "notify_ship_creation",
		attributes: {
			"project.id": b.projectId,
			"project.creator.slackId": b.slackUserId
		}
	}
	return await makeRequest("/ship", spanCfg, {
		user_id: b.slackUserId,
		project_name: b.projectName,
		project_link: createProjectLink(b.projectId)
	})
}

export async function notifyReviewAccept(b: NotsReviewRequestBody) {

	const spanCfg: SpanConfig = {
		spanName: "notify_review_accept",
		attributes: {
			"project.id": b.projectId,
			"project.creator.slackId": b.slackUserId
		}
	}
	return await makeRequest("/review-accept", spanCfg, {
		user_id: b.slackUserId,
		project_name: b.projectName,
		project_link: createProjectLink(b.projectId),
		reviewer_id: b.slackReviewerId,
		feedback: b.comment,
	})
}

interface NotsReviewRequestBody {
	slackUserId: string,
	projectId: string,
	projectName: string,
	slackReviewerId: string,
	comment: string,
}

export async function notifyReviewReject(b: NotsReviewRequestBody) {
	const spanCfg: SpanConfig = {
		spanName: "notify_review_reject",
		attributes: {
			"project.id": b.projectId,
			"project.creator.slackId": b.slackUserId
		}
	}
	return await makeRequest("/review-reject", spanCfg, {
		user_id: b.slackUserId,
		project_name: b.projectName,
		project_link: createProjectLink(b.projectId),
		reviewer_id: b.slackReviewerId,
		feedback: b.comment,
	})
} // aka ship failed


export async function notifyPaymentUnlocked() {
	throw new Error("this is not implemented yet")
	// const d = makeRequest("/payment_unlocked", {
	//
	// })
}

interface NotsOrderRequestBody {
	slackUserId: string,
	orderId: string,
	itemName: string,
	quantity: number,
	cost: number,
}
export async function notifyOrderCreated(b: NotsOrderRequestBody) {
	const spanCfg: SpanConfig = {
		spanName: "notify_order_created",
		attributes: {
			"order.id": b.orderId,
			"item.name": b.itemName,
			"order.cost": b.cost,
			"user.slackId": b.slackUserId
		}
	}
	return await makeRequest("/fulfill_pending", spanCfg, {
		user_id: b.slackUserId,
		order_id: b.orderId,
		item_name: b.itemName,
		qty: String(b.quantity),
		cost: createCurrencyMessage(b.cost)
	})
}
export async function notifyOrderApproved(b: NotsOrderRequestBody) {
	const spanCfg: SpanConfig = {
		spanName: "notify_order_approved",
		attributes: {
			"order.id": b.orderId,
			"item.name": b.itemName,
			"order.cost": b.cost,
			"user.slackId": b.slackUserId
		}
	}
	return await makeRequest("/fulfill_approved", spanCfg, {
		user_id: b.slackUserId,
		order_id: b.orderId,
		item_name: b.itemName,
		qty: String(b.quantity),
		cost: createCurrencyMessage(b.cost)
	})

}

interface NotsFulfillmentFailedRequestBody extends NotsOrderRequestBody {
	comment: string
}
export async function notifyFulfillmentRejected(b: NotsFulfillmentFailedRequestBody) {

	const spanCfg: SpanConfig = {
		spanName: "notify_fulfillment_rejected",
		attributes: {
			"order.id": b.orderId,
			"item.name": b.itemName,
			"order.cost": b.cost,
			"user.slackId": b.slackUserId
		}
	}
	return await makeRequest("/fulfill_reject", spanCfg, {
		user_id: b.slackUserId,
		order_id: b.orderId,
		item_name: b.itemName,
		qty: String(b.quantity),
		cost: createCurrencyMessage(b.cost),
		comment: b.comment
	})
}
interface NotsOrderFulfilledRequestBody extends NotsOrderRequestBody {
	fulfillerName: string
	trackingDetails: string
}
export async function notifyOrderFulfilled(b: NotsOrderFulfilledRequestBody) {
	const spanCfg: SpanConfig = {
		spanName: "notify_fulfillment_fulfilled",
		attributes: {
			"order.id": b.orderId,
			"item.name": b.itemName,
			"order.cost": b.cost,
			"user.slackId": b.slackUserId
		}
	}
	return await makeRequest("/fulfill_fullfilled", spanCfg, {
		user_id: b.slackUserId,
		order_id: b.orderId,
		item_name: b.itemName,
		qty: String(b.quantity),
		cost: createCurrencyMessage(b.cost),
		fulfilled_by: b.fulfillerName,
		tracking_details: b.trackingDetails
	})
}
export async function notifyVoteReceived() {
	throw new Error("this is not implemented yet")
	// const d = makeRequest("/vote")
}
/*
 *
				user_id=payload.user_id,
				project_name=payload.project_name,
				project_link=payload.project_link,
				vote=payload.vote,
				feedback=payload.feedback,
				currencies=payload.currencies,
 */
interface NotsVotingFinishedRequestBody {
	slackUserId: string
	projectName: string,
	projectId: string,
	rating: string
	payout: number
}
export async function notifyVotingFinished(b: NotsVotingFinishedRequestBody) {
	const spanCfg: SpanConfig = {
		spanName: "notify_voting_finished",
		attributes: {
			"project.id": b.projectId,
			"project.rating": b.rating,
			"ship.payout": b.payout,
			"user.slackId": b.slackUserId
		}
	}
	return await makeRequest("/voting-complete", spanCfg, {
		user_id: b.slackUserId,
		project_name: b.projectName,
		project_link: createProjectLink(b.projectId),
		rating: b.rating,
		payout: createCurrencyMessage(b.payout)
	})
}
