import Button from "@client/components/Button"
import { ImageUpload } from "@client/components/FileUpload"
import { client } from "@client/lib/api-client"
import { secondsToFormatTime } from "@client/lib/time"
import { NewDevlogRequestSchema } from "@shared/validation/devlogs"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router"
import z from "zod"
import type { Route } from "./+types/NewDevlog"
import { projectQuery } from "./ProjectDetails"
import PageHeader from "@client/components/PageHeaders"

export default function NewDevlog({ params: { projectId } }: Route.ComponentProps) {
	const navigate = useNavigate()

	const [images, setImages] = useState<File[]>([])
	const [form, setForm] = useState<{
		content?: string
	}>({})
	const { data: project } = useQuery(projectQuery(projectId))
	const { mutate: createDevlog } = useMutation({
		mutationFn: async () => {
			if (images.length < 1) {
				throw new Error("You have to add atleast one attachment")
			}
			const parsed = NewDevlogRequestSchema.safeParse(form)
			if (!parsed.success) {
				throw new Error(z.prettifyError(parsed.error))
			}
			const res = await client.api.projects[":id"].devlogs.$post({
				json: parsed.data,
				param: {
					id: projectId
				}
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message)
			}

			const data = await res.json()

			const imageRes = await client.api.devlogs[":id"].attachment.$post({
				param: { id: data.devlog.id },
				form: {
					images: images
				}
			})
			if (!imageRes.ok) {
				const data = await imageRes.json()
				throw new Error(data.message)
			}


			navigate(`/projects/${projectId}/`)
		}
	})

	return (
		<main className="p-4 w-full min-h-screen flex flex-col items-center gap-4">
			<PageHeader>New Devlog ({project?.unloggedTime ? secondsToFormatTime(project.unloggedTime) : "time not available"})</PageHeader>
			<textarea onInput={(ev) => setForm({ content: ev.currentTarget.value })} className="w-1/2 bg-dark-red min-h-1/2 rounded-4xl p-4 text-egg-yellow" placeholder="Write about what you did..." minLength={100}>
			</textarea>
			<ImageUpload onUpdate={(fs) => setImages(fs)} />

			<Button onClick={async (ev) => {
				ev.preventDefault()
				createDevlog()
			}} className="bg-dark-red border-egg-yellow border-4 text-egg-yellow">
				Post Devlog
			</Button>
		</main>
	)
}
