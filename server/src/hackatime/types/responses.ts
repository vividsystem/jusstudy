
export type BaseResponse<T> = Promise<{
	ok: true
	data: T
} | {
	ok: false
	error: string
	res: Response
}>

interface TrustBlue {
	trust_level: "blue"
	trust_value: 0
}

interface TrustRed {
	trust_level: "red"
	trust_value: 1
}

interface TrustYellow {
	trust_level: "yellow"
	trust_value: 3
}

interface TrustGreen {
	trust_level: "green"
	trust_value: 2
}

type TrustFactor = TrustBlue | TrustRed | TrustYellow | TrustGreen


export interface UserInfoResponse {
	id: number
	emails: string[]
	slack_id?: string
	github_username?: string
	trust_factor: TrustFactor
}


export interface HoursResponse {
	start_date: string // YYYY-MM-DD
	end_date: string // YYYY-MM-DD
	total_seconds: number
}

export interface StreakResponse {
	streak_days: number
}

interface Project {
	name: string
	type: string
	total_seconds: number
	most_recent_heartbeat: string // ISO 8601
	languages: string[]
	archived: boolean
}
export interface ProjectsResponse {
	projects: Project[]
}

export interface Heartbeat {
	id: string,
	created_at: string
	time: number
	category: string
	project: string
	language: string
	editor: string
	operating_system: string
	machine: string
	entity: string
}

export type LatestHeartbeatResponse = Heartbeat | { heartbeat: null }
