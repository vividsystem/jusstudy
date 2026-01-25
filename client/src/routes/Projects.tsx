import { client } from "@client/lib/api-client";
import { secondsToFormatTime } from "@client/lib/time";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Plus } from "lucide-react"


export default function Projects() {
	const { /*isPending, error,*/ data } = useQuery({
		queryKey: ["userProjects"],
		queryFn: async () => {
			try {
				const res = await client.api.projects.$get()
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.message)
				}

				const data = await res.json();
				return data
			} catch (error) {
				throw error
			}
		},
		throwOnError: true
	})
	return (
		<main className="w-full p-4">
			<div className="flex flex-row items-center justify-between w-full py-4 text-dark-brown">
				<h1 className="text-9xl">Your Projects</h1>
				<a href="/projects/new" className="w-fit bg-light-brown rounded-4xl border-4">
					<Plus className="size-24" />
				</a>
			</div>

			<div className="grid 2xl:grid-cols-5 grid-cols-3 gap-4">
				{data?.projects.length == 0 ? (
					"You don't have any projects yet"

				) : ""}
				{data?.projects.map((project) => (
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
				))}

			</div>
		</main>
	)
}
