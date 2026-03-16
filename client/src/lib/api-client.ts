import { hc } from "hono/client"
import type { AppType } from "@server/index"

const SERVER_URL = import.meta.env.DEV ? "http://localhost:3000" : import.meta.env.VITE_SERVER_URL!;
export const client = hc<AppType>(SERVER_URL, {
	init: {
		credentials: "include",
	}
});
