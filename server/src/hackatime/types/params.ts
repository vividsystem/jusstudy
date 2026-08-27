type BaseParams = Partial<{
	startDate: Date
	endDate: Date
}>

type RequestBaseParams = Partial<{
	start_date: string // YYYY-MM-DD
	end_date: string // YYYY-MM-DD
}>

export function transformBase<T extends BaseParams>({ startDate, endDate, ...p }: T): RequestBaseParams & Omit<T, "startDate" | "endDate"> {
	return {
		start_date: startDate?.toISOString().slice(0, 10),
		end_date: endDate?.toISOString().slice(0, 10),
		...p
	}
}



export interface HoursParams extends BaseParams {

}


export interface ProjectsParams extends BaseParams {
	include_archived: boolean
	projects: string // comma-seperated
	since: string // project discovery - ISO 8601
	until: string // project discovery - ISO 8601
}
