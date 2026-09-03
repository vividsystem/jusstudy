import RegionSelector from "@client/components/RegionSelector"
import ShopItemBox from "@client/components/ShopItemBox"
import { client } from "@client/lib/api-client"
import { authClient } from "@client/lib/auth-client"
import type { ShopRegion } from "@shared/validation"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Navigate } from "react-router"


export default function Shop() {
	const { data } = authClient.useSession()
	if (data == null) {
		return <Navigate to={"/"} />
	}

	const { data: regions } = useQuery({
		queryKey: ["shopRegions"],
		queryFn: async () => {
			const res = await client.api.shop.regions.$get()

			const data = await res.json()

			return data.regions
		}
	})


	return regions ? <Page userCoins={data.user.coins} regions={regions} /> : <p>loading regions</p>
}
function Page({ userCoins, regions }: { userCoins: number, regions: ShopRegion[] }) {
	const [selectedRegion, setSelectedRegion] = useState(regions[0]!.id)
	const { isPending, /*error,*/ data: shopItems, refetch: refetchItems } = useQuery({
		queryKey: ["shopItems"],
		queryFn: async () => {
			const res = await client.api.shop.regions[":id"].items.$get({ param: { id: selectedRegion } })
			const data = await res.json()
			return data.items
		}
	})
	return (
		<main className="w-full min-h-screen p-4">
			<div className="flex flex-row py-4 justify-between items-center">
				<h1 className="text-6xl">Shop</h1>

				<span className="text-4xl">{userCoins} Books</span>

				<div className="flex gap-2 items-center">

					<RegionSelector regions={regions} region={selectedRegion} setRegion={setSelectedRegion} onChange={() => refetchItems()} />
					<a className="text-4xl bg-dark-brown border-egg-yellow border-4 text-beige rounded-2xl w-fit p-4 flex flex-row items-center gap-12" href="/shop/orders">
						<h2>View orders</h2>
					</a>
				</div>
			</div>

			{
				isPending && (
					<p>Loading shop items</p>
				)
			}
			<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 items-center">
				{shopItems && shopItems?.length != 0 ? shopItems.map(item => (
					<ShopItemBox item={item} key={item.id} />
				)) : (
					<p>No items in shop yet</p>

				)}
			</div>
		</main >
	)
}


