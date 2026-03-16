import Button from "@client/components/Button";
import ProjectCard from "@client/components/ProjectCard";
import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { formatDate, secondsToFormatTime } from "@client/lib/time";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { Ship } from "lucide-react";
import { Navigate, useParams } from "react-router"

type DevlogResponse = InferResponseType<typeof client.api.projects[":id"]["devlogs"]["$get"]>
type ShipResponse = InferResponseType<typeof client.api.projects[":id"]["ships"]["$get"]>
type Devlogs = Extract<DevlogResponse, { devlogs: unknown }>["devlogs"]
type Ships = Extract<ShipResponse, { ships: unknown }>["ships"]

interface ProjectTimelineProps {
	devlogs: Devlogs
	ships: Ships
	projectId: string
}
export function ProjectTimeline(props: ProjectTimelineProps) {
	const items = [
		...props.devlogs.map(d => ({ type: "devlog" as const, createdAt: d.createdAt, data: d })),
		...props.ships.map(s => ({ type: "ship" as const, createdAt: s.createdAt, data: s })),
	].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
	return (
		<>

			{items.map(item =>
				item.type === "devlog"
					? <DevlogCard devlog={item.data} />
					: <ShipCard ship={item.data} />

			)}
			<Button href={`/projects/${props.projectId}/devlogs/new`} className="bg-dark-red border-egg-yellow border-5 text-egg-yellow w-fit">
				Write Devlog
			</Button>
		</>
	)
}


export function DevlogCard(props: { devlog: Devlogs[number] }) {
	return (
		<div className="p-4 border-egg-yellow bg-dark-red border-5 rounded-4xl text-beige w-1/2 text-balance">

			<p className="w-fit text-wrap">
				{props.devlog.content}
			</p>

			<span className="text-xl">logged {secondsToFormatTime(props.devlog.timeSpent)} on {formatDate(props.devlog.createdAt)}</span>

		</div>

	)

}

export function ShipCard({ ship }: { ship: Ships[number] }) {
	return (
		<div className="flex flex-row w-1/2 px-4">
			<p className="text-xl">shipped {secondsToFormatTime(ship.timeSpent)}({secondsToFormatTime(ship.loggedTime)}) on {formatDate(ship.createdAt)} (state: {ship.state != "finished" ? ship.state : ""})</p>
		</div>

	)

}


export default function ProjectDetails() {
	const { projectId } = useParams()
	const { pushError } = useErrors()
	if (!projectId) {
		return <Navigate to={"/projects"} />
	}
	const { /*isPending, error,*/ data: project } = useQuery({
		queryKey: ["singleProject", projectId],
		queryFn: async () => {
			const res = await client.api.projects[":id"].time.$get({
				param: {
					id: projectId
				}
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			const data = await res.json();
			return data
		},
	})

	const { /*isPending, error,*/ data: devlogs } = useQuery({
		queryKey: ["projectDevlogs", projectId],
		queryFn: async () => {


			const res = await client.api.projects[":id"].devlogs.$get({
				param: {
					id: projectId
				}
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)

				throw new Error(data.message)
			}

			const data = await res.json();
			return data.devlogs
		},
	})

	const { /*isPending, error,*/ data: ships } = useQuery({
		queryKey: ["projectShips", projectId],
		queryFn: async () => {
			const res = await client.api.projects[":id"].ships.$get({
				param: {
					id: projectId
				}
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)

				throw new Error(data.message)
			}

			const data = await res.json();
			return data.ships
		},
	})
	const { mutate: shipProject
	} = useMutation({
		mutationFn: async () => {
			const res = await client.api.projects[":id"].ships.$post({
				param: { id: projectId }
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)

				throw new Error(data.message)
			}

		},
	})

	return (
		<main className="w-full text-4xl flex flex-col items-center gap-4 p-4 relative">
			{project?.project && (
				<ProjectCard {...project!} editable={true} nDevlogs={devlogs?.length || 0} />
			)
			}
			<Button onClick={() => {
				shipProject()
			}}><Ship /></Button>
			{devlogs && ships && (
				<div className="w-full overflow-x-hidden flex flex-col gap-4 items-center">
					<ProjectTimeline projectId={projectId!} devlogs={devlogs} ships={ships} />
				</div>
			)}

			<p className="text-sm">{projectId}</p>
		</main >
	)
}
