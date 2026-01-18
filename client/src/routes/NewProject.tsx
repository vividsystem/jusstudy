import HackatimeProjectSelector from "@client/components/HackatimeProjectSelector";
import { Input } from "@client/components/Input";
import { client } from "@client/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function NewProjectPage() {
	const [form, setForm] = useState<{
		name: string,
		description?: string,
		demoLink?: string,
		repository?: string,
	}>({
		name: "",
	})
	const [hackatimeProjects, setHackatimeProjects] = useState<string[]>([])
	const { isPending, isError, isSuccess, mutate: createProject } = useMutation({
		mutationFn: async () => {
			console.log(form)
			const res = await client.api.projects.$post({
				json: form
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message)
			}

			const data = await res.json()

			for (let proj of hackatimeProjects) {
				await client.api.projects[":id"].link.$post({
					param: {
						id: data.project.id,
					},
					json: {
						id: proj
					}
				})
			}
			return res
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
		<main className="flex flex-col items-start text-4xl">
			<h1 className="text-8xl">Create a new Project</h1>
			<Input
				type="text"
				placeholder="Super duper great project name"
				label={"Project name"}
				name="name"
				onInput={(name) => setForm({ ...form, name })}
			/>
			<Input
				type="text"
				placeholder="Solves the universes problems"
				label={"Description"}
				name="description"
				onInput={(description) => setForm({ ...form, description })}
			/>

			{/* TODO: add project banner upload */}



			<Input
				type="url"
				placeholder="https://jusstudy.super.studied.com"
				label={"Demo link"}
				name="demo-url"
				onInput={(demoLink) => setForm({ ...form, demoLink })}
			/>
			<Input
				type="url"
				placeholder="https://github.com/vividsystem/jusstudy"
				label={"Repository Link"}
				name="repo-url"
				onInput={(repository) => setForm({ ...form, repository })}
			/>


			<HackatimeProjectSelector onSelect={(inp) => setHackatimeProjects(prev => [...prev, inp])} />


			<div className="flex flex-row-reverse justify-start gap-4">
				<button onClick={(ev) => {
					ev.preventDefault()
					createProject()
				}}>
					Create Project
				</button>
				<button>
					Cancel
				</button>
			</div>

		</main>
	)
}
