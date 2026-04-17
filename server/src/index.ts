import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { usersRoutes } from "./routes/users";
import { projectsRoute } from "./routes/projects";
import type { hc } from "hono/client";
import { shopRoute } from "./routes/shop";
import { reviewsRoute } from "./routes/reviews";
import { shipsRoute } from "./routes/ships";
import { voteRoute } from "./routes/vote";
import { adminRoute } from "./routes/admin";
import { requestId, type RequestIdVariables } from "hono/request-id";
import type { Logger } from "pino";
import { logger } from "./logger";
import { requestLogger } from "./middleware/logger";
import { devlogsRoute } from "./routes/devlogs";


export type Env = {
	Variables: {
		logger: Logger
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	} & RequestIdVariables
}

const app = new Hono<Env>().basePath("/api")
	.use("*", requestId())
	.use(
		cors({
			origin: process.env.CORS_ORIGIN || "http://localhost:5173",
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "OPTIONS", "PATCH", "DELETE"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	.use(requestLogger())
	.use(
		async (c, next) => {
			const session = await auth.api.getSession({ headers: c.req.raw.headers });

			if (!session) {
				c.set("user", null);
				c.set("session", null);
				await next();
				return;
			}

			c.set("user", session.user);
			c.set("session", session.session);
			await next();
		})
	.on(["POST", "GET"], "/auth/*", (c) => {
		return auth.handler(c.req.raw)
	})

	.get("/status", (c) => {
		return c.json({ message: "Up and running!" })
	})
	.route("/projects", projectsRoute)
	.route("/users", usersRoutes)
	.route("/shop", shopRoute)
	.route("/reviews", reviewsRoute)
	.route("/ships", shipsRoute)
	.route("/vote", voteRoute)
	.route("/admin", adminRoute)
	.route("/devlogs", devlogsRoute)

app.onError((err, c) => {
	logger.error({ err, url: c.req.url })
	return c.json({ message: "Something went wrong" }, 500)
})


export type Client = ReturnType<typeof hc<AppType>>;
export type AppType = typeof app;
export default app;
