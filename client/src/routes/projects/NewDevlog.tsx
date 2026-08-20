import Button from "@client/components/Button"
import { ImageUpload } from "@client/components/FileUpload"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { NewDevlogRequestSchema } from "@shared/validation/devlogs"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router"
import z from "zod"

export default function NewDevlog() {
	const { projectId } = useParams()
	if (!projectId) {
		return <Navigate to={"/projects"} />
	}
	return <Page projectId={projectId} />
}

function Page({ projectId }: { projectId: string }) {
	const navigate = useNavigate()
	const { pushError } = useErrors()

	const [images, setImages] = useState<File[]>([])
	const [form, setForm] = useState<{
		content?: string
	}>({})
	const { mutate: createDevlog } = useMutation({
		mutationFn: async () => {
			if (images.length < 1) {
				pushError("You have to add atleast one attachment")
				throw new Error("You have to add atleast one attachment")
			}
			const parsed = NewDevlogRequestSchema.safeParse(form)
			if (!parsed.success) {
				const e = z.prettifyError(parsed.error)
				pushError(e.toString())

				throw e
			}
			const res = await client.api.projects[":id"].devlogs.$post({
				json: parsed.data,
				param: {
					id: projectId
				}
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)

				throw new Error(data.message)
			}

			const data = await res.json()

			console.log(images)
			const imageRes = await client.api.devlogs[":id"].attachment.$post({
				param: { id: data.devlog.id },
				form: {
					images: images
				}
			})
			if (!imageRes.ok) {
				const data = await imageRes.json()
				pushError(data.message)

				throw new Error(data.message)
			}


			navigate(`/projects/${projectId}/`)
		}
	})

	return (
		<main className="p-4 w-full min-h-screen flex flex-col items-center gap-4">
			<h1 className="text-6xl text-dark-brown">New Devlog</h1>
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
