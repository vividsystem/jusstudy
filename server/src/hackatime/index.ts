import { ProjectDetailsResponseSchema, StatsResponseSchema, StatsSchema } from "./validation"
import type { ProjectDetailsResponse, StatsResponse } from "./types"

export type Features = "projects" | "languages"


interface BaseCfg {
	startDate?: Date,
	endDate?: Date
}

interface UserStatsCfg extends BaseCfg {
	features?: Features[]
}

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


	async userProjectDetails(user: string, cfg?: BaseCfg): Promise<ProjectDetailsResponse> {
		const url = this.constructUrl(`${this.baseUrl}/users/${user}/projects/details`, {
			start_date: cfg?.startDate?.toISOString().slice(0, 10),
			end_date: cfg?.endDate?.toISOString().slice(0, 10),
		})

		const res = await fetch(url, {
			headers: {
				"authorization": `bearer ${this.apiKey}`
			}
		})

		const body = await res.json()

		const parsed = ProjectDetailsResponseSchema.safeParse(body)
		if (!parsed.success) {
			console.log(JSON.stringify(body))
			console.log(parsed.error)
			return { success: false, error: "invalid response format" }
		}

		return parsed.data
	}


	async userStats(user: string, cfg?: UserStatsCfg): Promise<StatsResponse> {
		const url = this.constructUrl(`${this.baseUrl}/users/${user}/stats`, {
			start_date: cfg?.startDate?.toISOString().slice(0, 10),
			end_date: cfg?.endDate?.toISOString().slice(0, 10),
			features: cfg?.features?.join(",")
		})
		const res = await fetch(url, {
			headers: {
				"authorization": `bearer ${this.apiKey}`
			}
		})

		const body = await res.json()

		const parsed = StatsResponseSchema.safeParse(body)
		if (!parsed.success) {
			console.log(JSON.stringify(body))
			console.log(parsed.error)
			return { success: false, error: "invalid response format" }
		}
		return parsed.data
	}

}


const hackatime = new HackatimeClient(process.env.HACKATIME_API_KEY!)
export default hackatime
