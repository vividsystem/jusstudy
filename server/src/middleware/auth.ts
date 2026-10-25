import type { TypedResponse } from "hono"
import { createMiddleware } from "hono/factory"
import type { Env } from ".."
import type { UserType } from "@server/db/schema"
import type { User } from "better-auth"


export type LoggedInEnv = {
	Variables: Env["Variables"] & { user: User }
}

type ErrorBody = { message: string }
type Unauthorized = TypedResponse<ErrorBody, 401, "json">
type Forbidden = TypedResponse<ErrorBody, 403, "json">

export const loggedIn = createMiddleware<LoggedInEnv, string, {}, Unauthorized>(async (c, next) => {
	const user = c.get("user")
	if (!user) return c.json({ message: "Unauthorized" }, 401)

	await next()
})

export const loggedInAndEligible = createMiddleware<LoggedInEnv, string, {}, Unauthorized | Forbidden>(async (c, next) => {
	const user = c.get("user")
	if (!user) return c.json({ message: "Unauthorized" }, 401)
	if (user.banned || !user.yswsEligible) return c.json({ message: "Forbidden" }, 403)

	await next()
})

export const loggedInAsType = (types: UserType[]) => createMiddleware<LoggedInEnv, string, {}, Unauthorized | Forbidden>(async (c, next) => {
	const user = c.get("user")
	if (!user) return c.json({ message: "Unauthorized" }, 401)
	if (!types.includes(user.type)) return c.json({ message: "Forbidden" }, 403)

	await next()
})
