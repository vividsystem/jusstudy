import Button from "@client/components/Button"
import RegionSelector from "@client/components/RegionSelector"
import { authClient } from "@client/lib/auth-client"
import { clientURL } from "@client/lib/urls"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Navigate } from "react-router"
import { client } from "@client/lib/api-client"

function Onboarding() {
	const [region, setRegion] = useState<string>()
	const { data: accounts } = useQuery({
		queryKey: ["userAccounts"],
		queryFn: async () => {
			const { data: accounts } = await authClient.listAccounts()
			return accounts
		}
	})

	const { data: regions } = useQuery({
		queryKey: ["shopRegions"],
		queryFn: async () => {
			const res = await client.api.shop.regions.$get()
			const data = await res.json()
			return data.regions
		}
	})

	const connected = useMemo(() => accounts?.some((a) => a.providerId === "hackatime"), [accounts])

	const { data: session } = authClient.useSession()
	if (!session) {
		return <Navigate to={"/"} />
	}

	useEffect(() => {
		if (region) {
			authClient.updateUser({
				regionId: region
			})
		}

	}, [region])


	return <main className="w-full p-4 min-h-screen flex flex-col gap-2">
		<h1 className="text-4xl">Welcome!</h1>

		<div className="border-4 w-fit rounded-md bg-egg-yellow border-dark-red p-2 text-dark-red">
			<h2 className="text-2xl">Region</h2>
			{regions ? (
				<RegionSelector regions={regions} region={region || regions[0]!.id} setRegion={setRegion} />
			) : (
				<p>loading regions. please wait.</p>
			)}
		</div>

		<div className="border-4 w-fit rounded-md bg-egg-yellow border-dark-red p-2 text-dark-red">
			<h2 className="text-2xl">Hackatime</h2>
			<div className="flex items-center">
				<span className={`p-2 rounded-md ${connected ? "text-green-400" : "text-red-400"}`}>{connected ? "Connected" : "Not connected"}</span>
				{!connected && (
					<Button className="border-2" onClick={async () => {
						await authClient.linkSocial({
							provider: "hackatime",
							callbackURL: clientURL("/onboarding").toString()
						})

					}}>Connect</Button>
				)}
			</div>
		</div>
	</main >
}

export default Onboarding
