import { hc } from "hono/client"
import type { AppType } from "@server/index"

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
export const client = hc<AppType>(SERVER_URL, {
	init: {
		credentials: "include",
	}
});

export const fetchSingleProject = async (id: string) => {
	try {
		const res = await client.api.projects[":id"].time.$get({
			param: {
				id: id!
			}
		})
		if (!res.ok) {
			const data = await res.json()
			throw new Error(data.message)
		}

		const data = await res.json();
		console.log(data.timeLogged)
		return data
	} catch (error) {
		throw error
	}
}
