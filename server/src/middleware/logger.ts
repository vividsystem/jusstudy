import type { MiddlewareHandler } from "hono";
import { logger } from "../logger";
import type { Env } from "..";

export const requestLogger = (): MiddlewareHandler<Env> => {
	return async (c, next) => {
		const reqId = c.get("requestId")
		const user = c.get("user")
		c.set("logger", logger.child({ requestId: reqId, userId: user ? user.id : undefined }));
		await next()
	};
};

