import { client } from "@client/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react"


export default function Projects() {
	const { isPending, error, data } = useQuery({
		queryKey: ["userProjects"],
		queryFn: async () => {
			try {
				const res = await client.api.projects.$get()
				if (!res.ok) {
					return { projects: [] };
				}

				const data = await res.json();
				return data
			} catch (error) {
				return { projects: [] }
			}
		}
	})
	return (
		<main className="w-full">
			<div className="flex flex-row items-center justify-between w-full">
				<h1 className="text-9xl">Projects</h1>
				<a href="/projects/new" className="w-fit">
					<Plus className="size-24" />
				</a>
			</div>

			<div className="grid grid-cols-4">
				{data?.projects.length == 0 ? (
					"You don't have any projects yet"

				) : ""}
				{data?.projects.map((project) => (
					<div>
						{project.name}
					</div>
				))}

			</div>
		</main>
	)
}
