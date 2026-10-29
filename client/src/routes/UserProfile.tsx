import Button from "@client/components/Button";
import ProjectPreviewCard, { ProjectPreviewCardSkeleton } from "@client/components/ProjectPreviewCard";
import { Avatar } from "@client/components/UserIcon";
import { client } from "@client/lib/api-client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { Clock, PieChart } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router";
import { secondsToFormatTime } from "@client/lib/time";
import { DevlogCard } from "@client/components/devlogs/Card";
import type { Route } from "./+types/UserProfile";
import { queryClient } from "@client/lib/query-client";


export function CharacterSkeleton() {
	return (
		<div className="h-8 w-4 text-2xl bg-dark-brown rounded-md animate-pulse"></div>
	)
}

export function MultiCharacterSkeleton() {
	return (
		<div className="h-8 w-14 text-2xl bg-dark-brown rounded-md animate-pulse"></div>
	)
}

export function StatsSkeleton() {
	return (
		<>
			<div className="flex flex-col items-center justify-center gap-1">
				<CharacterSkeleton />
				<span className="h-min text-xl">Projects</span>
			</div>

			<div className="flex flex-col items-center justify-center gap-1">
				<CharacterSkeleton />
				<span className="h-min text-xl">Devlogs</span>
			</div>

			<div className="flex flex-col items-center justify-center gap-2">
				<CharacterSkeleton />
				<span className="h-min text-xl">Votes</span>
			</div>

			<div className="flex flex-col items-center justify-center gap-2">
				<CharacterSkeleton />
				<span className="h-min text-xl">Ships</span>
			</div>
		</>
	)
}

function UserProfileSkeleton() {
	return (

		<div className="p-4 flex items-center gap-4 border-4 border-dark-brown rounded-xl">
			<div className="flex flex-col gap-4 items-center p-4 text-white">
				<Avatar />
				<div className="text-4xl bg-dark-brown rounded-xl h-8 w-36 animate-pulse"></div>
			</div>
			<div className="flex flex-col items-start justify-start h-full">
				<div className="flex flex-row text-3xl items-center gap-2"><PieChart /> <h2>Stats</h2></div>
				<div className="grid grid-cols-2 grid-rows-2 gap-4"	>
					<StatsSkeleton />
				</div>
			</div>
			<div className="flex flex-col items-center justify-start h-full">
				<div className="flex flex-row text-3xl items-center gap-2 justify-start">
					<Clock />
					<h2>Coding time</h2>
				</div>
				<div className="h-full items-center justify-center flex">
					<MultiCharacterSkeleton />
				</div>
			</div>

		</div>
	)
}

export const userQuery = (id: string) => queryOptions({
	queryKey: ["user", id],
	queryFn: async () => {
		const res = await client.api.users[":id"].$get({ param: { id } })
		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message)
		}
		const data = await res.json()

		return data.user
	}
})

export const userStatsQuery = (id: string) => queryOptions({
	queryKey: ["userStats", id],
	queryFn: async () => {
		const res = await client.api.users[":id"].stats.$get({ param: { id: id } })
		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message)
		}

		const data = await res.json()

		return data.stats
	}
})

export const userProjectsQuery = (userId: string) => queryOptions({
	queryKey: ["userProjects", userId],
	queryFn: async () => {
		const res = await client.api.users[":id"].projects.$get({ param: { id: userId } })
		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message)
		}

		const data = await res.json()

		return data.userProjects
	}
})

export const userDevlogsQuery = (userId: string) => queryOptions({
	queryKey: ["userDevlogs", userId],
	queryFn: async () => {
		const res = await client.api.users[":id"].devlogs.$get({ param: { id: userId } })
		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message)
		}

		const data = await res.json()

		return data.devlogs
	}
})

export function clientLoader({ params }: Route.ClientLoaderArgs) {
	void queryClient.query(userQuery(params.id))
	void queryClient.query(userStatsQuery(params.id))
	void queryClient.query(userProjectsQuery(params.id))
	void queryClient.query(userDevlogsQuery(params.id))
	return null
}

export default function UserProfile({ params }: Route.ComponentProps) {
	const [showDevlogs, setShowDevlogs] = useState(true)

	const { isPending: userPending, data: user } = useQuery(userQuery(params.id))
	const { data: stats } = useQuery(userStatsQuery(params.id))
	const { data: projects } = useQuery(userProjectsQuery(params.id))
	const { data: devlogs } = useQuery(userDevlogsQuery(params.id))

	if (!user && !userPending) {
		return <Navigate to={"/home"} />
	}


	return (
		<main className="p-4 w-full min-h-screen flex flex-col items-center gap-4">
			{userPending ? <UserProfileSkeleton /> : <UserProfileCard user={user} stats={stats} devlogs={devlogs} />}
			<div className="w-full flex flex-col gap-4">
				<div className="flex flex-row gap-4 text-egg-yellow text-3xl w-full items-center justify-start">
					<Button onClick={() => setShowDevlogs(true)} className={`${showDevlogs ? "bg-dark-red border-egg-yellow" : "bg-dark-brown border-light-brown"} border-4`}>Devlogs</Button>
					<Button onClick={() => setShowDevlogs(false)} className={`${!showDevlogs ? "bg-dark-red border-egg-yellow" : "bg-dark-brown border-light-brown"} border-4`}>Projects</Button>
				</div>
				{devlogs && projects && (showDevlogs
					? (<DevlogTimeline devlogs={devlogs} user={user} />)
					: (<ProjectsGrid projects={projects} devlogs={devlogs || []} />)
				)}
			</div>

		</main>
	)
}

type Devlogs = Extract<InferResponseType<typeof client.api.users[":id"]["devlogs"]["$get"]>, { devlogs: unknown }>["devlogs"]
interface DevlogTimelineProps {
	devlogs?: Devlogs
	user?: Extract<InferResponseType<typeof client.api.users[":id"]["$get"]>, { user: unknown }>["user"]
}

function DevlogTimeline({ devlogs, user }: DevlogTimelineProps) {
	return (
		<div className="w-full flex flex-col items-center text-4xl">
			{devlogs && devlogs.map((d) => <DevlogCard devlog={d} project={d.project} user={user} />)}
			{devlogs?.length === 0 && (
				<p>no devlogs yet...</p>
			)}
		</div>
	)
}

interface ProjectsGridProps {
	projects?: Extract<InferResponseType<typeof client.api.users[":id"]["projects"]["$get"]>, { userProjects: unknown }>["userProjects"]
	devlogs: Devlogs
}

function ProjectsGrid({ projects, devlogs }: ProjectsGridProps) {
	return (
		<div className="grid 2xl:grid-cols-5 grid-cols-3 gap-4">
			{projects ? (<> {
				projects.length == 0 ? (
					"You don't have any projects yet"

				) : projects.map((p) => <ProjectPreviewCard project={p} nDevlogs={devlogs.reduce((acc, d) => d.projectId === p.id ? acc + 1 : acc, 0)} />)
			}</>) : (<>
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
				<ProjectPreviewCardSkeleton />
			</>)
			}
		</div>
	)

}


interface UserProfileCardProps {
	user: Extract<InferResponseType<typeof client.api.users[":id"]["$get"]>, { user: unknown }>["user"]
	stats?: Extract<InferResponseType<typeof client.api.users[":id"]["stats"]["$get"]>, { stats: unknown }>["stats"]
	devlogs?: Extract<InferResponseType<typeof client.api.users[":id"]["devlogs"]["$get"]>, { devlogs: unknown }>["devlogs"]
}

function UserProfileCard({ user, stats, devlogs }: UserProfileCardProps) {
	return (
		<div className="p-4 flex items-center gap-4 border-4 border-dark-brown rounded-xl">
			<div className="flex flex-col gap-4 items-center p-4">
				<Avatar imageURL={user.image} />
				<span className="text-4xl">{user.nickname}</span>
			</div>
			<div className="flex flex-col items-start justify-start h-full">
				<div className="flex flex-row text-3xl items-center gap-2"><PieChart /> <h2>Stats</h2></div>
				<div className="grid grid-cols-2 grid-rows-2 gap-4"	>

					{stats ? (<>
						<div className="flex flex-col items-center justify-center">


							<span className="h-min text-2xl">{String(stats.nProjects)}</span>
							<span className="h-min text-xl">Projects</span>
						</div>

						<div className="flex flex-col items-center justify-center">

							<span className="h-min text-2xl">{String(stats.nDevlogs)}</span>
							<span className="h-min text-xl">Devlogs</span>
						</div>

						<div className="flex flex-col items-center justify-center">
							<span className="h-min text-2xl">{String(stats.votesCast)}</span>
							<span className="h-min text-xl">Votes</span>
						</div>

						<div className="flex flex-col items-center justify-center">
							<span className="h-min text-2xl">{String(stats.nShips)}</span>
							<span className="h-min text-xl">Ships</span>
						</div>
					</>) : (<StatsSkeleton />)}
				</div>
			</div>
			<div className="flex flex-col items-center justify-start h-full">
				<div className="flex flex-row text-3xl items-center gap-2 justify-start">
					<Clock />
					<h2>Coding time</h2>
				</div>
				<div className="h-full items-center justify-center flex">
					{devlogs ? (
						<span className="text-3xl">{secondsToFormatTime(devlogs.reduce((acc, d) => acc + d.timeLogged, 0))}</span>
					) : (
						<MultiCharacterSkeleton />
					)}
				</div>
			</div>

		</div>
	)

}
