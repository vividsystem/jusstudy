import { client } from "@client/lib/api-client"
import { secondsToFormatTime, timeAgo } from "@client/lib/time"
import type { InferResponseType } from "hono"
import { BookOpen, Clock, Lock, Unlock } from "lucide-react"

interface ProjectCardProps {
	project: Extract<InferResponseType<typeof client.api.projects["$get"]>, { projects: unknown }>["projects"][number]
	nDevlogs?: number
}
export default function ProjectPreviewCard({ project, nDevlogs }: ProjectCardProps) {
	return (
		<a href={`/projects/${project.id}`} className="p-4 border-4 bg-dark-red text-egg-yellow text-4xl rounded-4xl">
			<h2 className="text-5xl text-beige">{project.name}</h2>
			{project.description && (
				<span className="line-clamp-3">{project.description}</span>
			)}
			{nDevlogs && (
				<div className="flex flex-items items-center gap-4">
					<BookOpen className="size-8" />
					<span>{nDevlogs} devlogs</span>
				</div>
			)}
			<div className="flex flex-items items-center gap-4">
				<Clock className="size-8" />
				<span>{secondsToFormatTime(project.totalTime)}</span>
			</div>
		</a>
	)
}

interface UserHistoryProjectCardProps extends ProjectCardProps {
	locks?: Extract<InferResponseType<typeof client.api.projects[":id"]["locks"]["$get"]>, { locks: unknown }>["locks"]
	unlock: () => void
}
export function UserHistoryProjectCard({ locks, project, nDevlogs, ...props }: UserHistoryProjectCardProps) {
	const lock = locks?.find((l) => l.unlockedAt === null)
	return (
		<a href={`/projects/${project.id}`} className="p-4 border-4 bg-dark-red text-egg-yellow text-4xl rounded-4xl">
			<div className="flex items-center justify-between">
				<h2 className="text-5xl text-beige">{project.name}</h2>
				{lock && (
					<button className={"border border-egg-yellow rounded-md p-2 bg-green-400"} onClick={() => props.unlock()}>
						<Unlock className="size-8" />
					</button>
				)}
			</div>
			{project.description && (
				<span className="line-clamp-3">{project.description}</span>
			)}
			{nDevlogs && (
				<div className="flex flex-items items-center gap-4">
					<BookOpen className="size-8" />
					<span>{nDevlogs} devlogs</span>
				</div>
			)}

			<div className="flex gap-2 items-center">
				<Lock />
				{!locks && (
					<span className="flex items-center gap-2">locked <CharacterSkeleton /> times</span>
				)}
				{locks && locks.length > 1 && (lock ? (
					<span>locked since {timeAgo(lock.lockedAt)} ({locks.length})</span>
				) : (
					<span>locked {locks.length} times</span>
				))}
				{locks && locks.length === 1 && (
					<span>{locks[0]?.unlockedAt === null ? "is" : "was"} locked for the first time</span>
				)}
				{locks && locks.length === 0 && (
					<span>never locked</span>
				)}
			</div>
			<div className="flex flex-items items-center gap-4">
				<Clock className="size-8" />
				<span>{secondsToFormatTime(project.totalTime)}</span>
			</div>
		</a >
	)

}


export function CharacterSkeleton() {
	return (
		<div className="h-7 w-8 text-2xl bg-egg-yellow rounded-md animate-pulse"></div>
	)
}

export function MultiCharacterSkeleton() {
	return (
		<div className="h-10 w-24 text-2xl bg-egg-yellow rounded-md animate-pulse"></div>
	)

}

export function ProjectPreviewCardSkeleton() {
	return (

		<div className="p-4 border-4 bg-dark-red text-egg-yellow text-4xl rounded-4xl flex flex-col gap-2">
			<div className="text-5xl bg-beige w-56 h-12 rounded-lg animate-pulse"></div>
			<div className="text-4xl bg-beige w-52 h-32 rounded-lg animate-pulse"></div>
			<div className="flex flex-items items-center gap-4">
				<BookOpen className="size-8" />
				<div className="flex flex-row items-center gap-2"><CharacterSkeleton /> <span>devlogs</span></div>
			</div>
			<div className="flex flex-items items-center gap-4">
				<Clock className="size-8" />
				<MultiCharacterSkeleton />
			</div>
		</div>
	)

}
