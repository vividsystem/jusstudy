import { client } from "@client/lib/api-client"
import { useQuery } from "@tanstack/react-query"
import Button from "./Button"

interface DevlogTimelineProps {
	projectId: string
}
export default function DevlogTimeline(props: DevlogTimelineProps) {
	const { data } = useQuery({
		queryKey: ["devlogs", props.projectId],
		queryFn: async () => {
			const res = await client.api.projects[":id"].devlogs.$get({
				param: {
					id: props.projectId
				}
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message)
			}

			const data = await res.json()
			return data.devlogs
		}
	})

	return (
		<>
			{data?.map(devlog => (
				<div className="p-4 bg-dark-red border-egg-yellow border-4 text-egg-yellow rounded-4xl w-1/2">
					<p className="w-inherit break-all">
						{devlog.content}
					</p>
				</div>
			))}
			<Button href={`/projects/${props.projectId}/devlogs/new`} className="bg-dark-red border-egg-yellow border-5 text-egg-yellow">
				Write Devlog
			</Button>
		</>
	)
}
