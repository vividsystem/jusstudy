import { client } from "@client/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash } from "lucide-react";
import { useNavigate, useParams } from "react-router"

export default function ProjectDetails() {
	const navigate = useNavigate()
	let { projectId } = useParams()
	const { /*isPending, error,*/ data } = useQuery({
		queryKey: ["singleProject"],
		queryFn: async () => {
			try {
				const res = await client.api.projects[":id"].$get({
					param: {
						id: projectId!
					}
				})
				if (!res.ok) {
					const data = await res.json()
					throw new Error(data.message)
				}

				const data = await res.json();
				return data
			} catch (error) {
				throw error
			}
		}
	})

	return (
		<main className="w-full text-4xl flex flex-col items-center">
			{data?.project && (
				<div className="border bg-white p-4 w-fit flex flex-col">
					<div className="flex flex-row gap-16 justify-between items-center">
						<h1 className="text-6xl w-fit">{data.project.name}</h1>
						<div className="flex flex-row gap-4">
							<Pencil className="size-8" />
							<Trash className="size-8" />
						</div>
					</div>
					<p>{data.project.description}</p>
					{(data.project?.demoLink || data.project?.repository || data.project?.readmeLink) && (
						<div className="flex flex-row mt-4 gap-4">
							{data.project?.demoLink != null && (
								<button
									className="p-4 bg-gray-700 text-white rounded-xl"
									onClick={() => navigate(data.project!.demoLink!)}
								>Demo</button>
							)}
							{data.project?.repository != null && (
								<button
									className="p-4 bg-gray-700 text-white rounded-xl"
									onClick={() => navigate(data.project!.repository!)}
								>Repository</button>
							)}
							{data.project?.readmeLink != null && (

								<button
									className="p-4 bg-gray-700 text-white rounded-xl"
									onClick={() => navigate(data.project!.readmeLink!)}
								>Readme</button>
							)}

						</div>
					)}
				</div>
			)
			}
			<p className="text-sm">{projectId}</p>
		</main >
	)
}
