import { createMiddleware } from "hono/factory"
import type { Env } from ".."
import type { UserType } from "@server/db/schema"
import type { User } from "better-auth"


export type LoggedInEnv = {
	Variables: Env["Variables"] & { user: User }
}

export const loggedIn = createMiddleware<LoggedInEnv>(async (c, next) => {
	const user = c.get("user")
	if (!user) return c.json({ message: "Unauthorized" }, 401)
	c.set("user", user)

	await next()
})

export const loggedInAndEligible = createMiddleware<LoggedInEnv>(async (c, next) => {
	const user = c.get("user")
	if (!user) return c.json({ message: "Unauthorized" }, 401)
	if (user.banned || !user.yswsEligible) return c.json({ message: "Forbidden" }, 403)
	c.set("user", user)

	await next()
})

export const loggedInAsType = (types: UserType[]) => createMiddleware<LoggedInEnv>(async (c, next) => {
	const user = c.get("user")
	if (!user) return c.json({ message: "Unauthorized" }, 401)
	if (!types.includes(user.type)) return c.json({ message: "Forbidden" }, 403)
	c.set("user", user)

	await next()
})
