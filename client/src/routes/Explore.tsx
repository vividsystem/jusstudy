import Button from "@client/components/Button"
import { DevlogCard } from "@client/components/devlogs/Card"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"

export default function ExplorePage() {
	const { pushError } = useErrors()
	const [offset, setOffset] = useState(0)
	const queryRecentDevlogs = async (offset: number) => {
		const res = await client.api.devlogs.recents.$get({ query: { offset: String(offset) } })
		if (!res.ok) {
			const data = await res.json()
			pushError(data.message)
			throw new Error(data.message)
		}

		const data = await res.json()
		return data.devlogs
	}

	const { data: devlogs, isPending } = useQuery({
		queryKey: ["recentDevlogs"],
		queryFn: async () => queryRecentDevlogs(offset),
		placeholderData: keepPreviousData
	})
	if (isPending && !devlogs) {
		return (
			<p>loading...</p>
		)
	}
	return (
		<main className="w-full p-4 min-h-screen flex flex-col gap-2 text-dark-red">

			<h1 className="text-4xl text-bold">Explore</h1>
			{devlogs?.length === 0 && (
				<p className="text-2xl text-dark-brown">There isn't anything to explore yet</p>
			)}
			{devlogs && devlogs.map(d => (
				<DevlogCard devlog={d} user={d.creator} project={d.project} />
			))}

			<Button onClick={() => setOffset(prev => prev + 1)} className="border-dark-red border-4 w-fit bg-egg-yellow text-dark-red">Load more</Button>

		</main>
	)
}
