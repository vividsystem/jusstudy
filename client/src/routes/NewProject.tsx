import Button from "@client/components/Button";
import HackatimeProjectSelector from "@client/components/HackatimeProjectSelector";
import { Input } from "@client/components/Input";
import { client } from "@client/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function NewProjectPage() {
	const navigate = useNavigate()
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
			navigate("/projects")
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

			<h1 className="text-8xl bg-dark-red p-4 rounded-4xl">Create a new Project</h1>
			<div className="flex flex-col bg-dark-red rounded-4xl p-4 gap-8 w-1/2">
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
			</div>

			<div className="flex flex-row-reverse justify-start gap-4 w-1/2">
				<Button onClick={(ev) => {
					ev.preventDefault()
					createProject()
				}} className="bg-green-700">
					Create Project
				</Button>
				<Button href="/projects" className="bg-dark-red">
					Cancel
				</Button>
			</div>

		</main>
	)
}
