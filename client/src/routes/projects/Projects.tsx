import PageHeader from "@client/components/PageHeaders";
import ProjectPreviewCard from "@client/components/ProjectPreviewCard";
import { client } from "@client/lib/api-client";
import { queryClient } from "@client/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react"
import { Link } from "react-router";


export const userProjectsQuery = queryOptions({
	queryKey: ["userProjects"],
	queryFn: async () => {
		const res = await client.api.projects.$get()
		if (!res.ok) {
			const data = await res.json();
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
				<PageHeader>Your projects</PageHeader>
				<Link to="/projects/new" className="w-fit bg-light-brown rounded-xl lg:rounded-3xl border-3 lg:border-4" prefetch="viewport">
					<Plus className="size-8 lg:size-16" />
				</Link>
			</div>

			<div className="grid 2xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
				{data?.projects.length == 0 ? (
					"You don't have any projects yet"

				) : ""}
				{data?.projects.map((p) => <ProjectPreviewCard project={p} key={p.id} />)}

			</div>
		</main>
	)
}
