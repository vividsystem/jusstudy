import type { client } from "@client/lib/api-client"
import type { InferResponseType } from "hono"
import { useState } from "react"
import { Avatar } from "../UserIcon"
import { formatDate, secondsToFormatTime } from "@client/lib/time"
import { ArrowLeft, ArrowRight } from "lucide-react"


type DevlogResponse = InferResponseType<typeof client.api.projects[":id"]["devlogs"]["$get"]>
type Devlogs = Extract<DevlogResponse, { devlogs: unknown }>["devlogs"]

interface DevlogCardProps {
	devlog: Devlogs[number]
	project?: {
		id: string
		name: string
	}
	user?: {
		id: string
		image?: string | null
		nickname: string
	}
}
export function DevlogCard({ devlog, project, user }: DevlogCardProps) {

	const [current, setCurrent] = useState(0);
	const next = () => setCurrent((prev) => (prev + 1 + devlog.attachments.length) % devlog.attachments.length)
	const prev = () => setCurrent((prev) => (prev - 1 + devlog.attachments.length) % devlog.attachments.length)
	return (
		<div className="p-4 border-egg-yellow bg-dark-red border-5 rounded-4xl text-beige w-1/2 text-balance flex flex-col gap-2">
			<div className="flex flex-col items-start text-egg-yellow">
				<div className="flex flex-row gap-2 items-center">
					{user && (
						<a className="flex flex-row gap-2 items-center" href={`/users/${user.id}`}>
							{user.image && (
								<Avatar size={8} imageURL={user.image} />
							)}
							<span>{user.nickname}</span>
						</a>
					)}

					<p>logged {secondsToFormatTime(devlog.timeSpent)} for {project ? (
						<a className="underline underline-offset-2" href={`/projects/${project.id}`}>{project.name}</a>
					) : (
						<span className="bg-egg-yellow h-6 w-32 animate-pulse rounded-md inline-block" />
					)}</p>
				</div>
				<p>on {formatDate(devlog.createdAt)}</p>
			</div>
			{devlog.attachments.length != 0 && (
				<div key={current} className="relative group rounded-lg overflow-hidden border border-gray-200 w-full">
					<img
						src={devlog.attachments[current]!.cdnURL}
						className={"w-full aspect-auto object-fill"}
					/>

					{devlog.attachments.length > 1 && (
						<>
							<button onClick={next}
								className="absolute top-1/2 right-1.5 items-center flex justify-center p-2 rounded-xl bg-black/60 text-egg-yellow opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<ArrowRight />
							</button>

							<button onClick={prev}
								className="absolute top-1/2 left-1.5 items-center flex justify-center p-2 rounded-xl bg-black/60 text-egg-yellow opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<ArrowLeft />
							</button>
						</>
					)}
				</div>

			)}

			<p className="w-fit text-wrap">
				{devlog.content}
			</p>

		</div>

	)

}
