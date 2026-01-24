import Button from "@client/components/Button";
import HackatimeProjectSelector from "@client/components/HackatimeProjectSelector";
import { Input } from "@client/components/Input";
import { client, fetchSingleProject } from "@client/lib/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

export default function EditProjectDetails() {
	const [form, setForm] = useState<{
		name?: string,
		description?: string,
		demoLink?: string,
		repository?: string,
	}>({})

	let { projectId } = useParams()
	const navigate = useNavigate()
	if (!projectId) {
		return navigate("/projects")
	}

	const { isPending, isSuccess, /*error,*/ data } = useQuery({
		queryKey: ["singleProject", projectId!],
		queryFn: async () => await fetchSingleProject(projectId!)
	})
	useEffect(() => {
		if (isMutationSuccess) {
			navigate(`/projects/${projectId}`)
		}
	})



	const [hackatimeProjects, setHackatimeProjects] = useState<string[]>([])
	const { isError, isSuccess: isMutationSuccess, mutate: updateProject } = useMutation({
		mutationFn: async () => {
			console.log(form)
			if (Object.values(form).some(value => value !== undefined)) {
				const res = await client.api.projects[":id"].$patch({
					json: form,
					param: {
						id: projectId!
					}
				})
				if (!res.ok) {
					const data = await res.json()
					throw new Error(data.message)
				}

				// const data = await res.json()
			}


			for (let proj of hackatimeProjects) {
				await client.api.projects[":id"].link.$post({
					param: {
						id: projectId,
					},
					json: {
						id: proj
					}
				})
			}
		}
	})



	useEffect(() => {
		if (isPending) {
			console.log("pending")
		} else if (isError) {
			console.log("error")
		} else if (isSuccess) {
			console.log("success")
		}
	})
	return (
		<main className="flex flex-col items-center text-4xl text-egg-yellow w-full min-h-screen gap-16">

			<h1 className="text-8xl bg-dark-red p-4 rounded-4xl">Update Project</h1>
			{!isPending ? (
				<>
					<div className="flex flex-col bg-dark-red rounded-4xl p-4 gap-8 w-1/2">
						<Input
							type="text"
							placeholder="Super duper great project name"
							label={"Project name"}
							name="name"
							onInput={(name) => setForm({ ...form, name })}
							defaultValue={data?.project.name}
						/>
						<Input
							type="text"
							placeholder="Solves the universes problems"
							label={"Description"}
							name="description"
							onInput={(description) => setForm({ ...form, description })}
							defaultValue={data?.project.description || undefined}
						/>

						{/* TODO: add project banner upload */}



						<Input
							type="url"
							placeholder="https://jusstudy.super.studied.com"
							label={"Demo link"}
							name="demo-url"
							onInput={(demoLink) => setForm({ ...form, demoLink })}
							defaultValue={data?.project.demoLink || undefined}
						/>
						<Input
							type="url"
							placeholder="https://github.com/vividsystem/jusstudy"
							label={"Repository Link"}
							name="repo-url"
							onInput={(repository) => setForm({ ...form, repository })}
							defaultValue={data?.project.repository || undefined}
						/>


						{/* TODO: make this work on edit */}
						<HackatimeProjectSelector onSelect={(inp) => setHackatimeProjects(prev => [...prev, inp])} />
					</div>

					<div className="flex flex-row-reverse justify-start gap-4 w-1/2">
						<Button onClick={(ev) => {
							ev.preventDefault()
							updateProject()
							navigate("/projects")
						}} className="bg-green-700">
							Update Project
						</Button>
						<Button href="/projects" className="bg-dark-red">
							Cancel
						</Button>
					</div>
				</>
			) : (
				<div className="text-9xl">Loading...</div>
			)
			}

		</main >
	)
}
