import Button from "@client/components/Button";
import ProjectCard from "@client/components/ProjectCard";
import { Avatar } from "@client/components/UserIcon";
import { client } from "@client/lib/api-client";
import { authClient } from "@client/lib/auth-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { formatDate, secondsToFormatTime } from "@client/lib/time";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { ArrowLeft, ArrowRight, BookOpen, Clock, DollarSign, Ship } from "lucide-react";
import { useState } from "react";
import { Navigate, useParams } from "react-router"

type DevlogResponse = InferResponseType<typeof client.api.projects[":id"]["devlogs"]["$get"]>
type ShipResponse = InferResponseType<typeof client.api.projects[":id"]["ships"]["$get"]>
type RatingsResponse = InferResponseType<typeof client.api.projects[":id"]["ratings"]["$get"]>
type Devlogs = Extract<DevlogResponse, { devlogs: unknown }>["devlogs"]
type Ships = Extract<ShipResponse, { ships: unknown }>["ships"]
type Ratings = Extract<RatingsResponse, { ratings: unknown }>["ratings"]

interface ProjectTimelineProps {
	devlogs: Devlogs
	ships: Ships
	project?: {
		id: string
		name: string
	}
	isOwner?: boolean
}
export function ProjectTimeline(props: ProjectTimelineProps) {
	const { pushError } = useErrors()
	const { data: ratings } = useQuery({
		queryKey: ["projectRatings", props.project?.id],
		queryFn: async () => {
			if (!props.isOwner) return []
			if (!props.project) return []
			const res = await client.api.projects[":id"].ratings.$get({
				param: {
					id: props.project.id
				}
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)

				throw new Error(data.message)
			}

			const data = await res.json();
			return data.ratings
		},
	})
	const items = [
		...props.devlogs.map(d => ({ type: "devlog" as const, createdAt: d.createdAt, data: d })),
		...props.ships.map(s => ({ type: "ship" as const, createdAt: s.createdAt, data: s })),
		...(ratings || []).map(r => ({ type: "rating" as const, createdAt: r.createdAt, data: r })),
	].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
	return (
		<>

			{props.isOwner && props.project && (
				<Button href={`/projects/${props.project.id}/devlogs/new`} className="bg-dark-red border-egg-yellow border-5 text-egg-yellow w-fit">
					Write Devlog
				</Button>
			)}
			{items.map(item => {
				switch (item.type) {
					case "devlog":
						return <DevlogCard devlog={item.data} project={props.project} />
					case "ship":
						return <ShipCard ship={item.data} />
					case "rating":
						return <RatingCard rating={item.data} />
				}
			}
			)}
		</>
	)
}
interface DevlogCardProps {
	devlog: Devlogs[number]
	project?: {
		id: string
		name: string
	}
	user?: {
		id: string
		image?: string | null
		nickname: string
	}
}
export function DevlogCard({ devlog, project, user }: DevlogCardProps) {

	const [current, setCurrent] = useState(0);
	const next = () => setCurrent((prev) => (prev + 1 + devlog.attachments.length) % devlog.attachments.length)
	const prev = () => setCurrent((prev) => (prev - 1 + devlog.attachments.length) % devlog.attachments.length)
	return (
		<div className="p-4 border-egg-yellow bg-dark-red border-5 rounded-4xl text-beige w-1/2 text-balance flex flex-col gap-2">
			<div className="flex flex-col items-start text-egg-yellow">
				<div className="flex flex-row gap-2 items-center">
					{user && (
						<a className="flex flex-row gap-2 items-center" href={`/user/${user.id}`}>
							{user.image && (
								<Avatar size={8} imageURL={user.image} />
							)}
							<span>{user.nickname}</span>
						</a>
					)}

					<p>logged {secondsToFormatTime(devlog.timeSpent)} for {project ? (
						<a className="underline underline-offset-2" href={`/projects/${project.id}`}>{project.name}</a>
					) : (
						<div className="bg-egg-yellow h-6 w-32 animate-pulse rounded-md inline-block"></div>
					)}</p>
				</div>
				<p>on {formatDate(devlog.createdAt)}</p>
			</div>
			{devlog.attachments.length != 0 && (
				<div key={current} className="relative group rounded-lg overflow-hidden border border-gray-200 w-full">
					<img
						src={devlog.attachments[current]!.cdnURL}
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

		</div>

	)

}

export function ShipCard({ ship }: { ship: Ships[number] }) {
	return (
		<div className="flex flex-col w-1/2 border-dark-brown bg-light-brown rounded-2xl border-4 p-4 text-beige">
			<div className="flex flex-row items-center gap-2">
				<Ship className="size-8" />
				<p>Ship</p>
				<span className={`border-3 rounded-xl p-1
					${ship.state == "failed" ? "bg-red-400 border-red-500 text-blue-400" : ""}
					${ship.state == "finished" ? "bg-green-400 border-green-500" : ""}
					${ship.state == "voting" || ship.state == "pre-payout" ? "bg-blue-400 border-blue-500 text-red-400" : ""}
					${ship.state == "pre-initial" || ship.state == "pre-fraud" ? "bg-yellow-400 border-yellow-500" : ""}
					`}>{ship.state}</span>
			</div>
			<div className="flex flex-row gap-8">
				<div className="flex flex-row gap-2 items-center">
					<Clock className="size-6" />
					<p>{secondsToFormatTime(ship.loggedTime)}</p>
				</div>
				{ship.payout && (
					<div className="flex flex-row gap-2 items-center">
						<BookOpen className="size-6" />
						<p>{ship.payout}</p>
					</div>
				)}
			</div>
			<p className="text-xl">on {formatDate(ship.createdAt)}</p>
		</div>

	)

}

export function RatingCard({ rating }: { rating: Ratings[number] }) {
	return (<div>

	</div>)
}



export default function ProjectDetails() {
	const { projectId } = useParams()
	if (!projectId) {
		return <Navigate to={"/projects"} />
	}
	return <Page projectId={projectId} />
}
function Page({ projectId }: { projectId: string }) {
	const { pushError } = useErrors()

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
					<ProjectTimeline project={project?.project} devlogs={devlogs} ships={ships} isOwner={isOwner()} />
				</div>
			)}

			<p className="text-sm">{projectId}</p>
		</main >
	)
}
