import Button from "@client/components/Button"
import { client } from "@client/lib/api-client"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router"

export default function NewDevlog() {
	const navigate = useNavigate()
	const { projectId } = useParams()
	if (!projectId) {
		return <Navigate to={"/projects"} />
	}

	const [form, setForm] = useState<{
		content: string
	}>({
		content: ""
	})
	const { mutate: createProject } = useMutation({
		mutationFn: async () => {
			const res = await client.api.projects[":id"].devlogs.$post({
				json: form,
				param: {
					id: projectId
				}
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message)
			}

			const data = await res.json()
			return data
		}
	})
	return (
		<main className="p-4 w-full min-h-screen flex flex-col items-center gap-4">
			<textarea onInput={(ev) => setForm({ content: ev.currentTarget.value })} className="w-1/2 bg-dark-red min-h-2/3 rounded-4xl p-4 text-egg-yellow" placeholder="Write about what you did..." minLength={100}>
			</textarea>
			<Button onClick={async (ev) => {
				ev.preventDefault()
				createProject()
				navigate(`/projects/${projectId}/`)

			}} className="bg-dark-red border-egg-yellow border-4 text-egg-yellow">
				Post Devlog

			</Button>
		</main>
	)
}
