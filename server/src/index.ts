import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { usersRoutes } from "./routes/users";
import { projectsRoute } from "./routes/projects";
import type { hc } from "hono/client";
import { shopRoute } from "./routes/shop";

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>().basePath("/api")

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
	.route("/shop", shopRoute);



export type Client = ReturnType<typeof hc<AppType>>;
export type AppType = typeof app;
export default app;
