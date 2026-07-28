import type { client } from "@client/lib/api-client"
import { secondsToFormatTime } from "@client/lib/time"
import type { InferResponseType } from "hono"
import { BookOpen, Clock } from "lucide-react"

interface ProjectCardProps {
	project: Extract<InferResponseType<typeof client.api.projects["$get"]>, { projects: unknown }>["projects"][number]
}
export default function ProjectPreviewCard({ project }: ProjectCardProps) {
	return (

		<a href={`/projects/${project.id}`} className="p-4 border-4 bg-dark-red text-egg-yellow text-4xl rounded-4xl">
			<h2 className="text-5xl text-beige">{project.name}</h2>
			{project.description && (
				<span className="line-clamp-3">{project.description}</span>
			)}
			<div className="flex flex-items items-center gap-4">
				<BookOpen className="size-8" />
				<span>0 devlogs</span>
			</div>
			<div className="flex flex-items items-center gap-4">
				<Clock className="size-8" />
				<span>{secondsToFormatTime(project.timeSpent)}</span>
			</div>
		</a>
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
