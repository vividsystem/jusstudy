import Button from "@client/components/Button";
import DevlogTimeline from "@client/components/DevlogTimeline";
import { fetchSingleProject } from "@client/lib/api-client";
import { secondsToFormatTime } from "@client/lib/time";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Pencil, Trash } from "lucide-react";
import { useParams } from "react-router"



export default function ProjectDetails() {
	let { projectId } = useParams()
	const { /*isPending, error,*/ data } = useQuery({
		queryKey: ["singleProject", projectId!],
		queryFn: async () => await fetchSingleProject(projectId!)
	})

	return (
		<main className="w-full text-4xl flex flex-col items-center gap-4">
			{data?.project && (
				<div className="border-5 rounded-2xl bg-dark-red text-egg-yellow p-4 w-fit flex flex-col gap-4">
					<div className="flex flex-row gap-16 justify-between items-center">
						<h1 className="text-6xl w-fit">{data.project.name}</h1>
						<div className="flex flex-row gap-4">
							<a href={`/projects/${projectId}/edit`}>
								<Pencil className="size-8" />
							</a>
							<Trash className="size-8" />
						</div>
					</div>
					<div className="flex flex-row gap-4 items-center text-beige">
						<div className="flex flex-items items-center gap-4">
							<BookOpen className="size-8" />
							<span>? devlogs</span>
						</div>
						<div className="flex flex-items items-center gap-4 ">
							<Clock className="size-8" />
							<span>{secondsToFormatTime(data.timeSpent || 0)} ({secondsToFormatTime(data.timeLogged || 0)} logged)</span>
						</div>
					</div>
					<p>{data.project.description}</p>
					<p className="text-beige">{data.project.category}</p>
					{(data.project?.demoLink || data.project?.repository || data.project?.readmeLink) && (
						<div className="flex flex-row mt-4 gap-4">
							{data.project?.demoLink != null && (
								<Button
									className="bg-dark-brown border-4 border-light-brown"
									href={data.project!.demoLink!}
									target="_blank"
								>Demo</Button>
							)}
							{data.project?.repository != null && (
								<Button
									className="bg-dark-brown border-4 border-light-brown"
									href={data.project!.repository!}
									target="_blank"
								>Repository</Button>
							)}
							{data.project?.readmeLink != null && (

								<Button
									className="bg-dark-brown border-4 border-light-brown"
									href={data.project!.readmeLink!}
									target="_blank"
								>Readme</Button>
							)}

						</div>
					)}
				</div>
			)
			}
			<DevlogTimeline projectId={projectId!} />

			<p className="text-sm">{projectId}</p>
		</main >
	)
}
