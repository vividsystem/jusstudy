import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useQuery } from "@tanstack/react-query"
export default function AdminStatsPage() {

	const { pushError } = useErrors()
	const { data: stats, isPending } = useQuery({
		queryKey: ["adminStats"],
		queryFn: async () => {
			const res = await client.api.admin.stats.$get()
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw data.message
			}

			const data = await res.json()
			return data

		}
	})

	if (!stats || isPending) {
		return <p>loading</p>
	}

	return (
		<main className="w-full min-h-screen p-4 text-4xl flex flex-col gap-4">
			<div className="flex flex-row w-full gap-4">
				<div className="p-4 bg-egg-yellow text-light-brown border-dark-red border-4 w-fit rounded-4xl h-fit">
					<h2 className="bold text-6xl text-dark-brown">Payout</h2>
					<p>Total book payout: {stats.payoutsGiven || 0}</p>
					<p>Average payout per ship: {stats.avgPayout || 0}</p>
					<p>Biggest payout: {stats.maxPayout || 0}</p>
					<p>Smallest payout: {stats.minPayout || 0}</p>
				</div>
				<div className="p-4 bg-egg-yellow text-light-brown border-dark-red border-4 w-fit rounded-4xl h-fit">
					<h2 className="bold text-6xl text-dark-brown">Ships</h2>
					<p>Number of ships made: {stats.shipsMade} ({stats.finishedShips} finished; {stats.failedShips} failed)</p>
					<p>In voting: {stats.shipsInVoting}</p>
					<p>Awaiting normal review: {stats.shipsAwaitingNormalReview}</p>
					<p>Awaiting fraud review: {stats.shipsAwaitingFraudReview}</p>
					<p>Awaiting payout review: {stats.shipsAwaitingPayout}</p>
				</div>
			</div>
		</main>
	)
}
