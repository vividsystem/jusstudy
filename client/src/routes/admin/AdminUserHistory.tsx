import Button from "@client/components/Button";
import Dialog, { type DialogHandle } from "@client/components/Dialog";
import { ProjectPreviewCardSkeleton, UserHistoryProjectCard } from "@client/components/ProjectPreviewCard";
import { Avatar } from "@client/components/UserIcon";
import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { Gavel, PieChart } from "lucide-react";
import { useRef, useState } from "react";
import { Navigate, useParams } from "react-router";

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
		</div>
	)
}


export default function UserProfile() {
	const { id } = useParams()
	if (!id) {
		return <Navigate to={"/home"} />
	}

	return <Page id={id} />

}

function Page(props: { id: string }) {
	const { pushError } = useErrors()

	const { isPending: userPending, data: user } = useQuery({
		queryKey: ["user", props.id],
		queryFn: async () => {
			const res = await client.api.users[":id"].$get({ param: { id: props.id } })
			if (!res.ok) {
				const err = await res.json();
				pushError(err.message);

				throw new Error(err.message)
			}
			const data = await res.json()

			return data.user
		}

	})
	const { data: stats } = useQuery({
		queryKey: ["stats", props.id],
		queryFn: async () => {
			const res = await client.api.users[":id"].stats.$get({ param: { id: props.id } })
			if (!res.ok) {
				const err = await res.json();
				pushError(err.message);

				throw new Error(err.message)
			}

			const data = await res.json()

			return data.stats
		}

	})

	const { data: projects } = useQuery({
		queryKey: ["userProjects", props.id],
		queryFn: async () => {
			const res = await client.api.users[":id"].projects.$get({ param: { id: props.id } })
			if (!res.ok) {
				const err = await res.json();
				pushError(err.message);

				throw new Error(err.message)
			}

			const data = await res.json()

			return data.userProjects
		}

	})

	const { data: locks } = useQuery({
		queryKey: ["userLocks", props.id],
		queryFn: async () => {
			const res = await client.api.users[":id"].locks.$get({ param: { id: props.id } })
			if (!res.ok) {
				const err = await res.json();
				pushError(err.message);

				throw new Error(err.message)
			}

			const data = await res.json()

			return data.locks

		}
	})


	if (!user && !userPending) {
		return <Navigate to={"/home"} />
	}


	return (
		<main className="p-4 w-full min-h-screen flex flex-col items-center gap-4">
			{userPending ? <UserProfileSkeleton /> : <UserProfileCard user={user} stats={stats} />}
			<div className="w-full flex flex-col gap-4">
				<ProjectsGrid projects={projects} locks={locks} />
			</div>

		</main>
	)
}

interface ProjectsGridProps {
	projects?: Extract<InferResponseType<typeof client.api.users[":id"]["projects"]["$get"]>, { userProjects: unknown }>["userProjects"]
	locks?: Extract<InferResponseType<typeof client.api.users[":id"]["locks"]["$get"]>, { locks: unknown }>["locks"]
}

function ProjectsGrid({ projects, locks }: ProjectsGridProps) {
	const [id, setId] = useState<string>()
	const unlockDialog = useRef<DialogHandle>(null)
	const { pushError } = useErrors()


	const { mutate: unlock } = useMutation({
		mutationFn: async () => {
			if (!id) return
			const res = await client.api.projects[":id"].unlock.$post({ param: { id: id } })
			if (!res.ok) {

				const err = await res.json();
				pushError(err.message);

				throw new Error(err.message)
			}
			setId(undefined)
		}
	})


	return (<>

		<Dialog ref={unlockDialog} blurBg>
			<span>Are you sure you want to unlock this project?</span>
			<Button
				onClick={() => {
					unlock()
					unlockDialog.current?.close()
				}}
				className="bg-green-400 p-2 rounded-md"
			>
				Unlock
			</Button>
			<Button onClick={() => {
				unlockDialog.current?.close()
			}}>Cancel</Button>
		</Dialog>

		<div className="grid 2xl:grid-cols-5 grid-cols-3 gap-4">
			{projects ? (<> {
				projects.length == 0 ? (
					"You don't have any projects yet"

				) : projects.map((p) => <UserHistoryProjectCard
					project={p}
					locks={locks?.filter((l) => l.projectId === p.id)}
					unlock={() => unlockDialog.current?.open()}
				/>)
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
	</>)

}


interface UserProfileCardProps {
	user: Extract<InferResponseType<typeof client.api.users[":id"]["$get"]>, { user: unknown }>["user"]
	stats?: Extract<InferResponseType<typeof client.api.users[":id"]["stats"]["$get"]>, { stats: unknown }>["stats"]
}

function UserProfileCard({ user, stats }: UserProfileCardProps) {
	const { pushError } = useErrors()
	const banDialog = useRef<DialogHandle>(null)
	const { mutate: banUser } = useMutation({
		mutationFn: async () => {
			const res = await client.api.users[":id"].ban.$post({ param: { id: user.id } })
			if (!res.ok) {
				const err = await res.json();
				pushError(err.message);

				throw new Error(err.message)
			}
		}
	})
	return (
		<div className="p-4 flex items-center gap-4 border-4 border-dark-brown rounded-xl">
			<Dialog ref={banDialog} blurBg>
				<p>Are you sure you want to ban <span className="font-bold">{user.nickname}</span>?</p>
				<div className="flex gap-2">
					<Button
						className="flex items-center bg-red-400 gap-2"
						onClick={() => {
							banUser()
							banDialog.current?.close()
						}}
					><Gavel />Ban</Button>
					<Button className="border" onClick={banDialog.current?.close}>Cancel</Button>
				</div>
			</Dialog>
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
			<div className="flex items-center justify-center">
				<Button
					className="flex items-center bg-red-400 gap-2"
					onClick={banDialog.current?.open}
				><Gavel /> Ban</Button>
			</div>
		</div>
	)

}
