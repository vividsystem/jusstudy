import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { users } from "./routes/users";
import { projectsRoute } from "./routes/projects";

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>().basePath("/api");


app.use(
	"/auth/*", // or replace with "*" to enable cors for all routes
	cors({
		origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);
app.use("*", async (c, next) => {
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
});
app.on(["POST", "GET"], "/auth/*", (c) => {
	return auth.handler(c.req.raw)
})

app.get("/status", (c) => {
	return c.json({ message: "Up and running!" })
})

app.route("/projects", projectsRoute)
app.route("/users", users)

export default app
