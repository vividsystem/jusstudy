import type { MiddlewareHandler } from "hono";
import { logger } from "../logger";
import type { Env } from "..";

export const requestLogger = (): MiddlewareHandler<Env> => {
	return async (c, next) => {
		const start = Date.now();

		// Attach reqId to context so route handlers can use it
		const reqId = c.get("requestId")
		c.set("logger", logger.child({ requestId: reqId }));
		const user = c.get("user")

		const reqLog = {
			method: c.req.method,
			url: c.req.url,
			// Omit cookies/auth headers in production
			userAgent: c.req.header("user-agent"),
		};

		await next();

		const responseTime = Date.now() - start;

		const logMsg = {
			req: reqLog,
			res: { statusCode: c.res.status },
			responseTime,
			userId: user?.id || undefined
		}

		logger.info(logMsg, "Request processed")
	};
};

