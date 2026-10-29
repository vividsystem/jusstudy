import { redirect, type DataStrategyResult, type MiddlewareFunction } from "react-router"
import { queryClient } from "./query-client"
import { sessionQuery } from "./session"
import { userContext, type SessionUser } from "./context"

type ClientMiddleware = MiddlewareFunction<Record<string, DataStrategyResult>>
export const authMiddleware: ClientMiddleware = async ({ request, context }) => {
	const session = await queryClient.query(sessionQuery)
	if (!session) {
		const { pathname, search } = new URL(request.url)
		throw redirect(`/?redirectTo=${encodeURIComponent(pathname + search)}`)
	}
	context.set(userContext, session.user)
}

export const requireRole = (...types: SessionUser["type"][]): ClientMiddleware =>
	({ context }) => {
		const user = context.get(userContext)
		if (!user || !types.includes(user.type)) throw redirect("/home")
	}
