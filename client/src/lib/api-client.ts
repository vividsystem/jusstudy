import { hc } from "hono/client"
import type { AppType } from "@server/index"

const SERVER_URL = import.meta.env.DEV ? "http://localhost:3000" : import.meta.env.VITE_SERVER_URL!;
export const client = hc<AppType>(SERVER_URL, {
	init: {
		credentials: "include",
	}
});

export const fetchSingleProject = async (id: string) => {
	try {
		const res = await client.api.projects[":id"].time.$get({
			param: {
				id: id
			}
		})
		if (!res.ok) {
			const data = await res.json()
			throw new Error(data.message)
		}

		const data = await res.json();
		return data
	} catch (error) {
		throw error
	}
}

export const fetchProjectDevlogs = async (projectId: string) => {
	try {
		const res = await client.api.projects[":id"].devlogs.$get({
			param: {
				id: projectId
			}
		})
		if (!res.ok) {
			const data = await res.json()
			throw new Error(data.message)
		}

		const data = await res.json();
		return data.devlogs
	} catch (error) {
		throw error
	}
}

export const fetchProjectShips = async (projectId: string) => {
	try {
		const res = await client.api.projects[":id"].ships.$get({
			param: {
				id: projectId
			}
		})
		if (!res.ok) {
			const data = await res.json()
			throw new Error(data.message)
		}

		const data = await res.json();
		return data.ships
	} catch (error) {
		throw error
	}
}
