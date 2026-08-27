import HackatimeOAuthClient from "."

const hackatime = new HackatimeOAuthClient()

type ClientRes<T> = Promise<{
	ok: true,
	data: T
} | {
	ok: false,
	error: string
	res?: Response
}>
export async function singleProjectTime(accessToken: string, links: string[]): ClientRes<number> {
	const res = await hackatime.projects(accessToken, { startDate: new Date(process.env.START_DATE!), projects: links.join(",") })
	if (!res.ok) {
		return { ok: false, error: res.error, res: res.res }
	}

	if (res.data.length != links.length) {
		return { ok: false, error: "Could not find hackatime projects" }
	}

	return { ok: true, data: res.data.reduce((acc, p) => acc + p.total_seconds, 0) }

}
export default hackatime;
