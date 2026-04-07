import Button from "@client/components/Button";
import ProjectCard from "@client/components/ProjectCard";
import { client } from "@client/lib/api-client";
import { authClient } from "@client/lib/auth-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { getSpaceFileURL } from "@client/lib/spaces";
import { formatDate, secondsToFormatTime } from "@client/lib/time";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { ArrowLeft, ArrowRight, DollarSign, Ship } from "lucide-react";
import { useState } from "react";
import { Navigate, useParams } from "react-router"

type DevlogResponse = InferResponseType<typeof client.api.projects[":id"]["devlogs"]["$get"]>
type ShipResponse = InferResponseType<typeof client.api.projects[":id"]["ships"]["$get"]>
type Devlogs = Extract<DevlogResponse, { devlogs: unknown }>["devlogs"]
type Ships = Extract<ShipResponse, { ships: unknown }>["ships"]

interface ProjectTimelineProps {
	devlogs: Devlogs
	ships: Ships
	projectId: string
	isOwner?: boolean
}
export function ProjectTimeline(props: ProjectTimelineProps) {
	const items = [
		...props.devlogs.map(d => ({ type: "devlog" as const, createdAt: d.createdAt, data: d })),
		...props.ships.map(s => ({ type: "ship" as const, createdAt: s.createdAt, data: s })),
	].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
	//2c953919-4f9f-469f-a4bf-303ab059ff22
	return (
		<>

			{props.isOwner && (
				<Button href={`/projects/${props.projectId}/devlogs/new`} className="bg-dark-red border-egg-yellow border-5 text-egg-yellow w-fit">
					Write Devlog
				</Button>
			)}
			{items.map(item =>
				item.type === "devlog"
					? <DevlogCard devlog={item.data} />
					: <ShipCard ship={item.data} />

			)}
		</>
	)
}

export function DevlogCard({ devlog }: { devlog: Devlogs[number] }) {

	const [current, setCurrent] = useState(0);
	const next = () => setCurrent((prev) => (prev + 1 + devlog.attachments.length) % devlog.attachments.length)
	const prev = () => setCurrent((prev) => (prev - 1 + devlog.attachments.length) % devlog.attachments.length)
	return (
		<div className="p-4 border-egg-yellow bg-dark-red border-5 rounded-4xl text-beige w-1/2 text-balance">

			{devlog.attachments.length != 0 && (
				<div key={current} className="relative group rounded-lg overflow-hidden border border-gray-200 w-full">
					<img
						src={getSpaceFileURL(devlog.attachments[current]!.spaceFileId)}
						className={"w-full aspect-auto object-fill"}
					/>

					{devlog.attachments.length > 1 && (
						<>
							<button onClick={next}
								className="absolute top-1/2 right-1.5 items-center flex justify-center p-2 rounded-xl bg-black/60 text-egg-yellow opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<ArrowRight />
							</button>

							<button onClick={prev}
								className="absolute top-1/2 left-1.5 items-center flex justify-center p-2 rounded-xl bg-black/60 text-egg-yellow opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<ArrowLeft />
							</button>
						</>
					)}
				</div>

			)}

			<p className="w-fit text-wrap">
				{devlog.content}
			</p>

			<span className="text-xl">logged {secondsToFormatTime(devlog.timeSpent)} on {formatDate(devlog.createdAt)}</span>

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

	const { data: sessionDetails } = authClient.useSession()
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
	const { mutate: shipProject } = useMutation({
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


	const isOwner = () => {
		return sessionDetails != null && sessionDetails.user != null && sessionDetails.user.id == project?.project.creatorId
	}

	return (
		<main className="w-full text-4xl flex flex-col items-center gap-4 p-4 relative">
			{project?.project && (
				<ProjectCard {...project!} editable={isOwner()} nDevlogs={devlogs?.length || 0} />
			)
			}
			{isOwner() && (
				<div className="flex flex-row gap-4">
					<Button onClick={() => {
						shipProject()
					}} className="border-dark-red border-4 rounded-4xl"><Ship /></Button>
					{ships?.find((s) => s.state == "pre-payout") && (
						<Button onClick={() => {
						}} className="border-dark-red border-4 rounded-4xl"><DollarSign /></Button>
					)}
				</div>
			)}
			{devlogs && ships && (
				<div className="w-full overflow-x-hidden flex flex-col gap-4 items-center">
					<ProjectTimeline projectId={projectId!} devlogs={devlogs} ships={ships} isOwner={isOwner()} />
				</div>
			)}

			<p className="text-sm">{projectId}</p>
		</main >
	)
}
