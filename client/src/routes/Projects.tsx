import ProjectPreviewCard from "@client/components/ProjectPreviewCard";
import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react"


export default function Projects() {
	const { pushError } = useErrors()
	const { /*isPending, error,*/ data } = useQuery({
		queryKey: ["userProjects"],
		queryFn: async () => {
			const res = await client.api.projects.$get()
			if (!res.ok) {
				const data = await res.json();
				pushError(data.message)

				throw new Error(data.message);
			}

			const data = await res.json();
			return data
		},
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
				{data?.projects.map((p) => <ProjectPreviewCard project={p} />)}

			</div>
		</main>
	)
}
