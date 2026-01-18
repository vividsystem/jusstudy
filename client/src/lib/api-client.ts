import { hc } from "hono/client"
import type { AppType } from "@server/index"

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
export const client = hc<AppType>(SERVER_URL, {
	init: {
		credentials: "include",
	}
});
