import { client } from "@client/lib/api-client"
import { secondsToFormatTime } from "@client/lib/time"
import { BookOpen, Pencil, Clock } from "lucide-react"
import Button from "./Button"
import type { InferResponseType } from "hono"

type ProjectResponse = InferResponseType<typeof client.api.projects[":id"]["time"]["$get"]>
type Project = Extract<ProjectResponse, { project: unknown }>

type ProjectCardProps = Project &
{
	editable: boolean
	nDevlogs: number
}

export default function ProjectCard({ project, timeSpent, timeLogged, nDevlogs, editable }: ProjectCardProps) {
	return (
		<div className="border-5 rounded-2xl bg-dark-red text-egg-yellow p-4 w-fit flex flex-col gap-4">
			<div className="flex flex-row gap-16 justify-between items-center">
				<h1 className="text-6xl w-fit">{project.name}</h1>
				<div className="flex flex-row gap-4">
					{editable && (
						<a href={`/projects/${project.id}/edit`}>
							<Pencil className="size-8" />
						</a>
					)}
				</div>
			</div>
			<div className="flex flex-row gap-4 items-center text-beige">
				<div className="flex flex-items items-center gap-4">
					<BookOpen className="size-8" />
					<span>{nDevlogs} devlog{nDevlogs != 1 ? "s" : ""}</span>
				</div>
				<div className="flex flex-items items-center gap-4 ">
					<Clock className="size-8" />
					<span>{secondsToFormatTime(timeSpent || 0)} ({secondsToFormatTime(timeLogged || 0)} logged)</span>
				</div>
			</div>
			<p>{project.description}</p>
			<p className="text-beige">{project.category}</p>
			{(project.demoLink || project.repository || project.readmeLink) && (
				<div className="flex flex-row mt-4 gap-4">
					{project.demoLink != null && (
						<Button
							className="bg-dark-brown border-4 border-light-brown"
							href={project.demoLink!}
							target="_blank"
						>Demo</Button>
					)}
					{project.repository != null && (
						<Button
							className="bg-dark-brown border-4 border-light-brown"
							href={project.repository!}
							target="_blank"
						>Repository</Button>
					)}
					{project.readmeLink != null && (

						<Button
							className="bg-dark-brown border-4 border-light-brown"
							href={project.readmeLink!}
							target="_blank"
						>Readme</Button>
					)}

				</div>
			)
			}
		</div >
	)
}
