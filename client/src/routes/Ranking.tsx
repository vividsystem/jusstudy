import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

export default function RankingPage() {
	const [userActive, setUserActive] = useState(true)
	return (
		<main className="flex flex-col gap-4 w-full p-4">
			<h1 className="text-7xl text-dark-brown">Ranking</h1>
			<div className="w-full flex flex-row text-5xl">
				<h2 className={`bg-dark-brown text-light-brown p-4 border-b-light-brown border-b-8 ${userActive ? "bg-dark-red" : ""}`} onClick={() => setUserActive(true)}>Users</h2>
				<h2 className={`bg-dark-brown text-light-brown p-4 border-b-light-brown border-b-8 ${!userActive ? "bg-dark-red" : ""}`} onClick={() => setUserActive(false)}>Projects</h2>
			</div>
			{userActive ? <UserRankings /> : <ProjectRankings />}
		</main>
	)
}

function UserRankings() {
	const { pushError } = useErrors()
	const { data: ranking, isLoading } = useQuery({
		queryKey: ["ranking"],
		queryFn: async () => {
			const res = await client.api.vote.rankings.users.$get()
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			const data = await res.json()
			return data.ranking
		}
	})
	if (!ranking || isLoading) {
		return (<p>loading</p>)
	}
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-row justify-between p-2  rounded-2xl text-3xl text-dark-brown gap-4">
				<span>#</span>
				<h2 className="w-1/2">Name</h2>

				<span className="overline">μ-3σ</span>
				<span className=""># of projects</span>
				<span className="">Score</span>
			</div>
			{
				ranking.map((rating) => (
					<div className="flex flex-row justify-between p-2 bg-dark-brown border-light-brown border-4 text-beige rounded-2xl text-3xl gap-4">
						<span className="w-fit">{rating.position}</span>
						<div className="w-full">
							{rating.creator.avatar && (
								<img src={rating.creator.avatar} className="size-4" />
							)}

							<h2 className="">{rating.creator.name}</h2>
						</div>
						<span>{rating.avgOrdinals}</span>
						<span>{rating.nProjects}</span>
						<span>{rating.userScore}</span>
					</div>
				))
			}
		</div >
	)
}

function ProjectRankings() {
	const { pushError } = useErrors()
	const { data: ranking, isLoading } = useQuery({
		queryKey: ["ranking"],
		queryFn: async () => {
			const res = await client.api.vote.rankings.projects.$get()
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			const data = await res.json()
			return data.ranking
		}
	})
	if (!ranking || isLoading) {
		return (<p>loading</p>)
	}
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-row justify-between p-2  rounded-2xl text-3xl text-dark-brown">
				<span>#</span>
				<h2 className="w-1/2">Name</h2>
				<span>μ-3σ</span>
			</div>
			{ranking.map((rating) => (
				<a className="flex flex-row justify-between p-2 bg-dark-brown border-light-brown border-4 text-beige rounded-2xl text-3xl" href={`/projects/${rating.id}`} target="_blank" rel="noreferrer" >
					<span className="w-fit">{rating.position}</span>
					<h2 className="w-full px-4">{rating.name}</h2>
					<span>{rating.ordinal}</span>
				</a>
			))}
		</div>

	)
}
