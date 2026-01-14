import { StatsResponseSchema, StatsSchema } from "./validation"
import type { StatsResponse } from "./types"
import z from "zod"

export type Features = "projects" | "languages"

class HackatimeClient {
	baseUrl: string
	apiKey: string
	constructor(apiKey: string, baseUrl?: string) {
		this.baseUrl = baseUrl ?? "https://hackatime.hackclub.com/api/v1"
		this.apiKey = apiKey
	}


	private constructUrl(path: string, params?: Record<string, string | undefined>): URL {
		const url = new URL(path, this.baseUrl);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, value);
				}
			});
		}

		return url;
	}

	async userStats(user: string, cfg?: { startDate?: Date, endDate?: Date, features?: Features[] }): Promise<StatsResponse> {
		const url = this.constructUrl(`${this.baseUrl}/users/${user}/stats`, {
			start_date: cfg?.startDate?.toISOString().slice(0, 10),
			end_date: cfg?.endDate?.toISOString().slice(0, 10),
			features: cfg?.features?.join(",")
		})
		const res = await fetch(url, {
			headers: {
				"Authorization": `Bearer ${this.apiKey}`
			}
		})

		const body = await res.json()

		const parsed = StatsResponseSchema.safeParse(body)
		if (!parsed.success) {
			return { success: false, error: "Invalid response format" }
		}

		return parsed.data
	}

}


const hackatime = new HackatimeClient(process.env.HACKATIME_API_KEY!)
export default hackatime
