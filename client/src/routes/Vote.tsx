import Button from "@client/components/Button"
import Rating from "@client/components/Rating"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { secondsToFormatTime } from "@client/lib/time"
import { STAR_BUDGET } from "@server/voting"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono"
import { ArrowLeft, ArrowRight, Clock } from "lucide-react"
import { useState } from "react"
import { DevlogCard } from "./ProjectDetails"


type Votes = Extract<InferResponseType<typeof client.api.vote.rounds.$post>, { round: unknown }>
type VoteState = {
	technicality: number
	implementation: number
	documentation: number
	creativity: number
}

const defaultVote: VoteState = {
	technicality: 0,
	implementation: 0,
	documentation: 0,
	creativity: 0
}

export default function VotePage() {
	const [votes, setVotes] = useState<Record<number, VoteState>>({})
	const [index, setIndex] = useState(0);
	const { pushError } = useErrors()
	const { data, isPending, refetch } = useQuery({
		queryKey: ["vote"],
		queryFn: async () => {
			const res = await client.api.vote.rounds.active.$get()
			if (!res.ok && res.status != 404) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			} else if (res.status == 404) {
				const createRoundRes = await client.api.vote.rounds.$post()
				if (!createRoundRes.ok) {
					const data = await createRoundRes.json()
					pushError(data.message)

					throw new Error(data.message)
				}

				const data = await createRoundRes.json()
				return data
			}
			const data = await res.json()
			return data
		},
	})

	const { mutate: submitRatings } = useMutation({
		mutationFn: async () => {
			const res = await client.api.vote.rounds[":id"].rate.$post({
				param: { id: data!.round.id },
				json: {
					ratings: sorted.map(p => ({
						...(votes[p.position]!),
						projectId: p.id,
					}))
				}
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}
			startNew()
			return
		}
	})
	if (isPending || !data) {
		//replace with skeleton
		return <p>loading</p>
	}

	const sorted = data.projects.sort((a, b) => a.position - b.position);

	const startNew = () => {
		refetch()
		setVotes({})
		setIndex(0)
	}

	const prev = () => setIndex(i => Math.max(0, i - 1));
	const next = () => setIndex(i => (i + 1) % (sorted.length + 1));

	const sumAllVotes = () => {
		return Object.values(votes).reduce((prev, curr) => (
			prev + curr.implementation + curr.documentation + curr.creativity + curr.technicality
		), 0)
	}
	const updateVote = (position: number, field: keyof VoteState, value: number) => {
		if (sumAllVotes() - (votes[position] ? votes[position][field] : 0) + value > STAR_BUDGET) return
		setVotes(prev => ({
			...prev,
			[position]: { ...prev[position] ?? defaultVote, [field]: value }
		}))
	}
	return (
		<main className="p-4 w-full flex flex-col items-center gap-4">
			<span className="text-3xl">Stars used: {sumAllVotes()}/{STAR_BUDGET}</span>
			<div className="flex justify-between items-start gap-4 w-full h-full">
				<button
					onClick={prev}
					disabled={index === 0}
					className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed self-center flex flex-col"
				>
					<ArrowLeft className="size-8" />
					{index !== 0 && (
						<p>{index}/4</p>
					)}

				</button>

				{sorted[index] ? (
					<VoteCard
						project={sorted[index]}
						setVote={(f, v) => updateVote(sorted[index]!.position, f, v)}
						vote={votes[sorted[index].position] ?? defaultVote}
					/>
				) : (

					<SubmissionCard onSubmission={() => submitRatings()} />
				)}

				<button onClick={next} className="p-2 rounded-full self-center">
					<ArrowRight className="size-8" />
					{index != sorted.length - 1 && (
						<p>{(index + 1) % sorted.length}/4</p>
					)}
				</button>
			</div>

		</main>
	)
}

interface VoteCardProps {
	project: Votes["projects"][number]
	vote: VoteState
	setVote: (field: keyof VoteState, value: number) => void

}
export function VoteCard({ project, vote, setVote }: VoteCardProps) {
	//add a dialog w/devlogs
	const { pushError } = useErrors()
	const { data, isLoading } = useQuery({
		queryKey: ["devlogs", project.id],
		queryFn: async () => {
			const res = await client.api.projects[":id"].devlogs.$get({ param: { id: project.id } })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			const data = await res.json()
			return data.devlogs
		}
	})
	return (
		<div>
			<div className="border-dark-red bg-egg-yellow border-4 rounded-4xl text-dark-brown flex flex-col justify-between">
				<div className="p-4 flex flex-col gap-2">
					<h2 className="text-7xl">{project.name}</h2>
					<p className="text-4xl text-light-brown">{project.description}</p>
					<div className="flex flex-row gap-2 text-4xl items-center">
						<Clock />
						<span>
							{secondsToFormatTime(project.loggedTime)}
						</span>
					</div>
					<div className="flex flex-row gap-2">
						{project.demoLink && (
							<Button href={project.demoLink} target="_blank" rel="noreferrer" className="border-2 border-dark-red text-3xl">Demo</Button>
						)}
						{project.repository && (
							<Button href={project.repository} target="_blank" rel="noreferrer" className="border-2 border-dark-red text-3xl">Repo</Button>
						)}
						{project.readmeLink && (
							<Button href={project.readmeLink} target="_blank" rel="noreferrer" className="border-2 border-dark-red text-3xl">Readme</Button>
						)}
					</div>
				</div>
				<ScoreCard setVote={setVote} vote={vote} />
			</div >
			{isLoading && (
				<p className="text-4xl">Loading devlogs...</p>
			)}
			{!isLoading && data && data.length > 0 ? (
				<div className="flex flex-col gap-4">
					{data.map((d) => <DevlogCard devlog={d} />)}
				</div>
			) : (
				<p className="text-4xl">This project has no devlogs</p>
			)}
		</div>
	)
}

interface ScoreCardProps {
	setVote: VoteCardProps["setVote"]
	vote: VoteCardProps["vote"]
}
function ScoreCard({ setVote, vote }: ScoreCardProps) {
	return (<div className="flex flex-col px-2 py-4 text-4xl border-t-dark-red border-t-4">
		<div className="flex flex-row items-center justify-between">
			<span>Technicality</span>
			<Rating n={5} setRating={(n) => setVote("technicality", n)} rating={vote.technicality} />
		</div>
		<div className="flex flex-row items-center justify-between">
			<span>Creativity</span>
			<Rating n={5} setRating={(n) => setVote("creativity", n)} rating={vote.creativity} />
		</div>
		<div className="flex flex-row items-center justify-between">
			<span>Documentation</span>
			<Rating n={5} setRating={(n) => setVote("documentation", n)} rating={vote.documentation} />
		</div>
		<div className="flex flex-row items-center justify-between">
			<span>Implementation</span>
			<Rating n={5} setRating={(n) => setVote("implementation", n)} rating={vote.implementation} />
		</div>
	</div>)
}

function SubmissionCard({ onSubmission }: { onSubmission: () => void }) {

	return (
		<div className="bg-egg-yellow border-4 border-dark-red rounded-4xl p-4 flex flex-col gap-4 text-dark-brown">

			<h1 className="text-5xl">Have you considered your votes carefully?</h1>
			<p className="text-2xl">You have to spend ALL stars!</p>
			<Button onClick={onSubmission} className="border-4 border-dark-red text-dark-brown text-4xl bg-light-brown">Submit</Button>
		</div>
	)
}
