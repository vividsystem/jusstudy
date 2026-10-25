import { externalTracer, withSpan } from "@server/lib";
import { transformBase, type HoursParams, type ProjectsParams } from "./types/params";
import type { HoursResponse, UserInfoResponse, StreakResponse, ProjectsResponse, LatestHeartbeatResponse, BaseResponse, Heartbeat } from "./types/responses";
import { SpanKind, SpanStatusCode, type Attributes } from "@opentelemetry/api";
import { externalServiceFailures } from "@server/lib/metrics";

interface SpanConfig<A extends object> {
	name: string,
	attributes?: (body: A) => Attributes
}

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

	private async makeRequest<R extends object>(path: string, accessToken: string, spanCfg: SpanConfig<R>, params?: Record<string, string | boolean | undefined>): BaseResponse<R> {
		const url = this.constructUrl(path, params)
		return await withSpan(externalTracer, SpanKind.CLIENT, spanCfg.name, async (span) => {
			const res = await fetch(url, {
				headers: {
					"Authorization": `Bearer ${accessToken}`
				}
			})
			if (!res.ok) {
				externalServiceFailures.add(1, { service: "hackatime", operation: path })
				if (params) {
					span.setAttributes(params)
				}
				span.setStatus({ code: SpanStatusCode.ERROR })
				return this.handleErroneousResponse(res)
			}

			const body = await res.json() as R

			if (spanCfg.attributes) {
				span.setAttributes(spanCfg.attributes(body))
			}

			return {
				ok: true,
				data: body
			} as { ok: true, data: R }
		})
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
		return await this.makeRequest<UserInfoResponse>("authenticated/me", accessToken, {
			name: "hackatime.user.info",
		})
	}

	async hours(accessToken: string, params: Partial<HoursParams>): BaseResponse<HoursResponse> {
		return await this.makeRequest<HoursResponse>("authenticated/hours", accessToken, {
			name: "hackatime.user.hours",
		}, transformBase(params))
	}


	async streak(accessToken: string): BaseResponse<StreakResponse> {
		return await this.makeRequest<StreakResponse>("authenticated/streak", accessToken, {
			name: "hackatime.user.streak"
		})
	}

	async projects(accessToken: string, params: Partial<ProjectsParams>): BaseResponse<ProjectsResponse> {
		return await this.makeRequest<ProjectsResponse>("authenticated/projects", accessToken, {
			name: "hackatime.user.projects",
			attributes: (b) => ({ "hackatime.user.projects.number": b.projects.length })
		}, transformBase(params))
	}

	async latestHeartbeat(accessToken: string): BaseResponse<Heartbeat | null> {
		const body = await this.makeRequest<LatestHeartbeatResponse>("authenticated/heartbeat/latest", accessToken, {
			name: "hackatime.user.latestHeartbeat",
		})
		if (!body.ok) {
			return body
		} else if ("heartbeat" in body) {
			return {
				ok: true,
				data: null
			}
		}

		return {
			ok: true,
			data: body.data as Heartbeat
		}
	}
}
export default HackatimeOAuthClient
