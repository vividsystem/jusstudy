import Button from "@client/components/Button";
import { client, fetchProjectDevlogs, fetchProjectShips, fetchSingleProject } from "@client/lib/api-client";
import { formatDate, secondsToFormatTime } from "@client/lib/time";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { BookOpen, Clock, Pencil, Ship } from "lucide-react";
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
	let { projectId } = useParams()
	if (!projectId) {
		return <Navigate to={"/projects"} />
	}
	const { /*isPending, error,*/ data: project } = useQuery({
		queryKey: ["singleProject", projectId],
		queryFn: async () => await fetchSingleProject(projectId),
		throwOnError: true
	})

	const { /*isPending, error,*/ data: devlogs } = useQuery({
		queryKey: ["projectDevlogs", projectId],
		queryFn: async () => await fetchProjectDevlogs(projectId),
		throwOnError: true
	})

	const { /*isPending, error,*/ data: ships } = useQuery({
		queryKey: ["projectShips", projectId],
		queryFn: async () => await fetchProjectShips(projectId),
		throwOnError: true
	})
	const { mutate: shipProject
	} = useMutation({
		mutationFn: async () => {
			const res = await client.api.projects[":id"].ships.$post({
				param: { id: projectId }
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message)
			}

		},
		throwOnError: true
	})

	return (
		<main className="w-full text-4xl flex flex-col items-center gap-4 p-4 relative">
			{project?.project && (
				<div className="border-5 rounded-2xl bg-dark-red text-egg-yellow p-4 w-fit flex flex-col gap-4">
					<div className="flex flex-row gap-16 justify-between items-center">
						<h1 className="text-6xl w-fit">{project.project.name}</h1>
						<div className="flex flex-row gap-4">
							<a href={`/projects/${projectId}/edit`}>
								<Pencil className="size-8" />
							</a>
						</div>
					</div>
					<div className="flex flex-row gap-4 items-center text-beige">
						<div className="flex flex-items items-center gap-4">
							<BookOpen className="size-8" />
							<span>? devlogs</span>
						</div>
						<div className="flex flex-items items-center gap-4 ">
							<Clock className="size-8" />
							<span>{secondsToFormatTime(project.timeSpent || 0)} ({secondsToFormatTime(project.timeLogged || 0)} logged)</span>
						</div>
					</div>
					<p>{project.project.description}</p>
					<p className="text-beige">{project.project.category}</p>
					{(project.project?.demoLink || project.project?.repository || project.project?.readmeLink) && (
						<div className="flex flex-row mt-4 gap-4">
							{project.project?.demoLink != null && (
								<Button
									className="bg-dark-brown border-4 border-light-brown"
									href={project.project!.demoLink!}
									target="_blank"
								>Demo</Button>
							)}
							{project.project?.repository != null && (
								<Button
									className="bg-dark-brown border-4 border-light-brown"
									href={project.project!.repository!}
									target="_blank"
								>Repository</Button>
							)}
							{project.project?.readmeLink != null && (

								<Button
									className="bg-dark-brown border-4 border-light-brown"
									href={project.project!.readmeLink!}
									target="_blank"
								>Readme</Button>
							)}

						</div>
					)}
				</div>
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
