import ProjectPreviewCard from "@client/components/ProjectPreviewCard";
import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react"
import { Link } from "react-router";


export const userProjectsQuery = queryOptions({
	queryKey: ["userProjects"],
	queryFn: async () => {
		const { pushError } = useErrors()
		const res = await client.api.projects.$get()
		if (!res.ok) {
			const data = await res.json();
			pushError(data.message)

			throw new Error(data.message);
		}

		const data = await res.json();
		return data
	}
})

export function clientLoader() {
	void queryClient.query(userProjectsQuery)
	return null
}

export default function Projects() {
	const { data } = useQuery(userProjectsQuery)
	return (
		<main className="w-full p-4">
			<div className="flex flex-row items-center justify-between w-full py-4 text-dark-brown">
				<h1 className="text-9xl">Your Projects</h1>
				<Link to="/projects/new" className="w-fit bg-light-brown rounded-4xl border-4" prefetch="viewport">
					<Plus className="size-24" />
				</Link>
			</div>

			<div className="grid 2xl:grid-cols-5 grid-cols-3 gap-4">
				{data?.projects.length == 0 ? (
					"You don't have any projects yet"

				) : ""}
				{data?.projects.map((p) => <ProjectPreviewCard project={p} key={p.id} />)}

			</div>
		</main>
	)
}
