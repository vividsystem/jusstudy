import Button from "@client/components/Button";
import { BannerUpload } from "@client/components/FileUpload";
import HackatimeProjectSelector from "@client/components/HackatimeProjectSelector";
import { Input } from "@client/components/Input";
import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { type ProjectCategories } from "@server/db/schema";
import { UpdateProjectRequestSchema } from "@shared/validation/projects";
import { projectCategoryValues } from "@shared/vars";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import z from "zod";
import type { Route } from "./+types/EditProjectDetails";
import { projectQuery } from "./ProjectDetails";

export default function EditProjectDetails({ params }: Route.ComponentProps) {

	const [form, setForm] = useState<{
		name?: string,
		description?: string,
		demoLink?: string,
		repository?: string,
		category?: ProjectCategories
	}>({})
	const [file, setFile] = useState<File>()

	const navigate = useNavigate()
	const { pushError } = useErrors()
	const [hackatimeProjects, setHackatimeProjects] = useState<string[]>([])

	const { isPending, data: project } = useQuery(projectQuery(params.projectId))
	const { mutate: updateProject } = useMutation({
		mutationFn: async () => {
			if (file) {
				const res = await client.api.projects[":id"].banner.$put({
					form: { banner: file },
					param: { id: params.projectId }
				})
				if (!res.ok) {
					const data = await res.json()

					pushError(data.message)

					// prevent duplicate creation of project and redirect but still show user the error
					//throw new Error(data.message) 
				}
			}
			if (Object.values(form).some(value => value !== undefined)) {
				const parsed = UpdateProjectRequestSchema.safeParse(form)
				if (!parsed.success) {

					const e = z.prettifyError(parsed.error).toString()
					pushError(e.toString())

					throw e
				}
				const res = await client.api.projects[":id"].$patch({
					json: parsed.data,
					param: {
						id: params.projectId
					}
				})
				if (!res.ok) {
					const data = await res.json()

					pushError(data.message)
					throw new Error(data.message)
				}

				// const data = await res.json()
			}

			for (const proj of hackatimeProjects) {
				await client.api.projects[":id"].link.$post({
					param: {
						id: params.projectId,
					},
					json: {
						id: proj
					}
				})
			}
		},
	})

	return (
		<main className="flex flex-col items-center text-4xl text-egg-yellow w-full min-h-screen gap-16">

			<h1 className="text-8xl bg-dark-red p-4 rounded-4xl">Update Project</h1>
			{!isPending ? (
				<>
					<div className="flex flex-col bg-dark-red rounded-4xl p-4 gap-8 w-1/2">
						<BannerUpload onUpdate={(f) => setFile(f)} fallbackUrl={project?.banner} />
						<Input
							type="text"
							placeholder="Super duper great project name"
							label={"Project name"}
							name="name"
							onInput={(name) => setForm({ ...form, name })}
							defaultValue={project?.name}
						/>
						<Input
							type="text"
							placeholder="Solves the universes problems"
							label={"Description"}
							name="description"
							onInput={(description) => setForm({ ...form, description })}
							defaultValue={project?.description || undefined}
						/>

						{/* TODO: add project banner upload */}



						<div>
							<label>Category</label>
							<select className="border-2 border-egg-yellow p-4 w-full rounded-2xl" onChange={(ev) => setForm({ ...form, category: ev.currentTarget.value as ProjectCategories })} defaultValue={project?.category || undefined}>
								{projectCategoryValues.map(category => (
									<option value={category} key={category}>{category}</option>
								))}
							</select>
						</div>

						<Input
							type="url"
							placeholder="https://jusstudy.super.studied.com"
							label={"Demo link"}
							name="demo-url"
							onInput={(demoLink) => setForm({ ...form, demoLink })}
							defaultValue={project?.demoLink || undefined}
						/>
						<Input
							type="url"
							placeholder="https://github.com/vividsystem/jusstudy"
							label={"Repository Link"}
							name="repo-url"
							onInput={(repository) => setForm({ ...form, repository })}
							defaultValue={project?.repository || undefined}
						/>


						{/* TODO: make this work on edit */}
						<HackatimeProjectSelector onSelect={(inp) => setHackatimeProjects(prev => [...prev, inp])} />
					</div>

					<div className="flex flex-row-reverse justify-start gap-4 w-1/2">
						<Button onClick={(ev) => {
							ev.preventDefault()
							updateProject()
							navigate(`/projects/${params.projectId}`)
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
