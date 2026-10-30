import { Navigate } from "react-router"
import { useUser } from "@client/lib/useUser"
import { queryOptions, useQuery } from "@tanstack/react-query";
import { client } from "@client/lib/api-client";
import type { ProjectShipStatus } from "@server/db/schema";
import { queryClient } from "@client/lib/query-client";
import { timeAgo } from "@client/lib/time";
import { Ship } from "lucide-react";


export const userShipsQuery = queryOptions({
	queryKey: ["currentUserShips"],
	queryFn: async () => {
		const res = await client.api.ships.$get()
		if (!res.ok) {
			const data = await res.json()
			throw new Error((data as { message: string }).message)
		}

		const data = await res.json()
		return data.ships
	}
})

export function clientLoader() {
	void queryClient.query(userShipsQuery)
	return null
}

const shipStepLabel: Record<ProjectShipStatus, string> = {
	"pre-initial": "Waiting for review",
	"voting": "In voting",
	"pre-fraud": "Final checks",
	"pre-payout": "Payout pending",
	"finished": "Paid out",
	"failed": "Needs changes - you can reship",
}

function Home() {
	const { data: userShips } = useQuery(userShipsQuery)
	const user = useUser();
	if (!user.regionId) {
		return <Navigate to={"/onboarding"} />
	}

	return (
		<main className="max-w-xl flex flex-col gap-6 items-center min-h-screen p-4">
			{user.banned && (<>
				<h2 className="text-5xl">You are banned</h2>
			</>)}

			{!user.yswsEligible && !user.banned && (<>
				<h2>You are not YSWS eligible right now!</h2>
				<p>This means that you are either 1. too old, 2. haven't finished your identity check or 3. have been banned</p>
			</>)}

			<div className="bg-dark-red border-egg-yellow border-2 rounded-xl p-2 gap-2 flex flex-col">
				<h2 className="text-egg-yellow text-3xl flex flex-row gap-2 items-center"><Ship /> Ships</h2>
				<div className="flex flex-row overflow-y-scroll">
					{userShips?.map((ship) => (
						<div className="bg-light-brown text-beige p-2 rounded-xl">
							<h3 className="text-egg-yellow text-2xl">{ship.projectName} - {timeAgo(ship.createdAt)}</h3>
							<p className="text-xl">{shipStepLabel[ship.state]}</p>
						</div>
					))}
				</div>
			</div>

		</main>
	)
}


export default Home
