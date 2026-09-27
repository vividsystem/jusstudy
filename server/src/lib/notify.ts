
// https://fastapi.tiangolo.com/tutorial/handling-errors/#the-resulting-response
interface BotErrorType {
	detail: string
}

interface NotsResponse {
	ok: false,
	channel: string
	ts: string // some wheird floating point timestamp id combo?
}

async function makeRequest<V>(path: string, body: V) {
	const url = new URL(path, process.env.BOT_HOST!)
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${process.env.BOT_ACCESS_TOKEN}`
		},
		body: JSON.stringify(body)
	})
	if (!res.ok) {
		const data = await res.json() as BotErrorType
		return data
	}

	const data = await res.json() as NotsResponse

	return data
}

function createProjectLink(projectId: string) {
	return new URL(`/projects/${projectId}`, process.env.CLIENT_URL).toString()
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
	const d = await makeRequest("/ship", {
		user_id: b.slackUserId,
		project_name: b.projectName,
		project_link: createProjectLink(b.projectId)
	})

	if ("ok" in d) {
		return d
	} else {
		return { ...d, ok: false }
	}
}

export async function notifyReviewAccept(b: NotsReviewRequestBody) {
	const d = await makeRequest("/review-accept", {
		user_id: b.slackUserId,
		project_name: b.projectName,
		project_link: createProjectLink(b.projectId),
		reviewer_id: b.slackReviewerId,
		feedback: b.comment,
		currencies: createCurrencyMessage(b.coinsRewarded)
	})

	if ("ok" in d) {
		return d
	} else {
		return { ...d, ok: false }
	}
}

interface NotsReviewRequestBody {
	slackUserId: string,
	projectId: string,
	projectName: string,
	slackReviewerId: string,
	comment: string,
}

export async function notifyReviewReject(b: NotsReviewRequestBody) {
	const d = await makeRequest("/review-reject", {
		user_id: b.slackUserId,
		project_name: b.projectName,
		project_link: createProjectLink(b.projectId),
		reviewer_id: b.slackReviewerId,
		feedback: b.comment,
	})

	if ("ok" in d) {
		return d
	} else {
		return { ...d, ok: false }
	}
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
	const d = await makeRequest("/fulfill_pending", {
		user_id: b.slackUserId,
		order_id: b.orderId,
		item_name: b.itemName,
		quantity: String(b.quantity),
		cost: createCurrencyMessage(b.cost)
	})

	if ("ok" in d) {
		return d
	} else {
		return { ...d, ok: false }
	}

}
export async function notifyOrderApproved(b: NotsOrderRequestBody) {
	const d = await makeRequest("/fulfill_approved", {
		user_id: b.slackUserId,
		order_id: b.orderId,
		item_name: b.itemName,
		quantity: String(b.quantity),
		cost: createCurrencyMessage(b.cost)
	})

	if ("ok" in d) {
		return d
	} else {
		return { ...d, ok: false }
	}
}

interface NotsFulfillmentFailedRequestBody extends NotsOrderRequestBody {
	comment: string
}
export async function notifyFulfillmentRejected(b: NotsFulfillmentFailedRequestBody) {
	const d = await makeRequest("/fulfill_rejected", {
		user_id: b.slackUserId,
		order_id: b.orderId,
		item_name: b.itemName,
		quantity: String(b.quantity),
		cost: createCurrencyMessage(b.cost),
		comment: b.comment
	})
	if ("ok" in d) {
		return d
	} else {
		return { ...d, ok: false }
	}
}
interface NotsOrderFulfilledRequestBody extends NotsOrderRequestBody {
	fulfillerName: string
	trackingDetails: string
}
export async function notifyOrderFulfilled(b: NotsOrderFulfilledRequestBody) {
	const d = await makeRequest("/fulfill_finished", {
		user_id: b.slackUserId,
		order_id: b.orderId,
		item_name: b.itemName,
		quantity: String(b.quantity),
		cost: createCurrencyMessage(b.cost),
		fulfilled_by: b.fulfillerName,
		tracking_details: b.trackingDetails
	})

	if ("ok" in d) {
		return d
	} else {
		return { ...d, ok: false }
	}
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
	const d = await makeRequest("/voting-complete", {
		user_id: b.slackUserId,
		project_name: b.projectName,
		project_link: createProjectLink(b.projectId),
		rating: b.rating,
		payout: `${b.payout} Books`
	})

	if ("ok" in d) {
		return d
	} else {
		return { ...d, ok: false }
	}
	throw new Error("this is not implemented yet")
	// const d = makeRequest("/voting")
}
