import { transformBase, type HoursParams, type ProjectsParams } from "./types/params";
import type { HoursResponse, UserInfoResponse, StreakResponse, ProjectsResponse, LatestHeartbeatResponse, BaseResponse, Heartbeat } from "./types/responses";



class HackatimeOAuthClient {
	baseUrl: string
	constructor(baseUrl?: string) {
		this.baseUrl = baseUrl ?? "https://hackatime.hackclub.com/api/v1/"
	}


	private constructUrl(path: string, params?: Record<string, string | boolean | undefined>): URL {
		const url = new URL(path, this.baseUrl);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					if (typeof value === "boolean") {
						url.searchParams.append(key, "")
					} else {
						url.searchParams.append(key, value);
					}
				}
			});
		}

		return url;
	}


	private handleErroneousResponse(res: Response): Extract<Awaited<BaseResponse<unknown>>, { error: unknown }> {
		if (res.status == 401) {
			return { ok: false, error: "Missing or invalid OAuth access token", res }
		} else if (res.status == 403) {
			return { ok: false, error: "Insufficient scopes", res }
		} else {
			return { ok: false, error: "Unknown error", res }
		}
	}

	async currentUserInfo(accessToken: string): BaseResponse<UserInfoResponse> {
		const url = this.constructUrl("authenticated/me")


		const res = await fetch(url, {
			headers: {
				"Authorization": `Bearer ${accessToken}`
			}
		})
		if (!res.ok) {
			return this.handleErroneousResponse(res)
		}

		const body = await res.json()

		return {
			ok: true,
			data: body as UserInfoResponse
		}
	}

	async hours(accessToken: string, params: Partial<HoursParams>): BaseResponse<HoursResponse> {
		const url = this.constructUrl("authenticated/hours", transformBase(params))

		const res = await fetch(url, {
			headers: {
				"Authorization": `Bearer ${accessToken}`
			}
		})

		if (!res.ok) {
			return this.handleErroneousResponse(res)
		}

		const body = await res.json()

		return {
			ok: true,
			data: body as HoursResponse
		}

	}


	async streak(accessToken: string): BaseResponse<StreakResponse> {
		const url = this.constructUrl("authenticated/streak")


		const res = await fetch(url, {
			headers: {
				"Authorization": `Bearer ${accessToken}`
			}
		})

		if (!res.ok) {
			return this.handleErroneousResponse(res)
		}

		const body = await res.json()

		return {
			ok: true,
			data: body as StreakResponse
		}

	}

	async projects(accessToken: string, params: Partial<ProjectsParams>): BaseResponse<ProjectsResponse["projects"]> {
		const url = this.constructUrl("authenticated/projects", transformBase(params))

		const res = await fetch(url, {
			headers: {
				"Authorization": `Bearer ${accessToken}`
			}
		})

		if (!res.ok) {
			return this.handleErroneousResponse(res)
		}

		const body = await res.json() as ProjectsResponse

		return {
			ok: true,
			data: body.projects
		}
	}

	async latestHeartbeat(accessToken: string): BaseResponse<Heartbeat | null> {
		const url = this.constructUrl("authenticated/heartbeat/latest")

		const res = await fetch(url, {
			headers: {
				"Authorization": `Bearer ${accessToken}`
			}
		})

		if (!res.ok) {
			return this.handleErroneousResponse(res)
		}

		const body = await res.json() as LatestHeartbeatResponse
		if ("heartbeat" in body) {
			return {
				ok: true,
				data: null
			}
		}

		return {
			ok: true,
			data: body
		}

	}
}
export default HackatimeOAuthClient
