import RegionSelector from "@client/components/RegionSelector"
import ShopItemBox from "@client/components/ShopItemBox"
import { client } from "@client/lib/api-client"
import { useUser } from "@client/lib/useUser"
import type { ShopRegion } from "@shared/validation"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link, Navigate } from "react-router"
import type { Route } from "./+types/Shop"
import { userContext } from "@client/lib/context"
import { queryClient } from "@client/lib/query-client"

export const shopItemsQuery = (regionId: string) => queryOptions({
	queryKey: ["shopRegionalItems", regionId],
	queryFn: async () => {
		const res = await client.api.shop.regions[":id"].items.$get({ param: { id: regionId } })
		const data = await res.json()
		return data.items
	}
})

export const shopRegionsQuery = queryOptions({
	queryKey: ["shopRegions"],
	queryFn: async () => {
		const res = await client.api.shop.regions.$get()

		const data = await res.json()

		return data.regions
	}
})

export function clientLoader({ context }: Route.ClientLoaderArgs) {
	const user = context.get(userContext)
	if (user?.regionId) {
		void queryClient.query(shopItemsQuery(user.regionId))
	}
	void queryClient.query(shopRegionsQuery)
	return null
}


export default function Shop() {
	const user = useUser()
	const { data: regions } = useQuery(shopRegionsQuery)
	if (!user.regionId) {
		return <Navigate to={"/onboarding"} />
	}



	return regions ? <Page userCoins={user.coins} regions={regions} userRegion={user.regionId} /> : <p>loading regions</p>
}



function Page({ userCoins, userRegion, regions }: { userCoins: number, userRegion: string, regions: ShopRegion[] }) {
	const [selectedRegion, setSelectedRegion] = useState(userRegion)
	const { isPending, data: shopItems, refetch: refetchItems } = useQuery(shopItemsQuery(selectedRegion))
	return (
		<main className="w-full min-h-screen p-4">
			<div className="flex flex-row py-4 justify-between items-center">
				<h1 className="text-6xl">Shop</h1>

				<span className="text-4xl">{userCoins} Books</span>

				<div className="flex gap-2 items-center">

					<RegionSelector regions={regions} region={selectedRegion} setRegion={setSelectedRegion} onChange={() => refetchItems()} />
					<Link className="text-4xl bg-dark-brown border-egg-yellow border-4 text-beige rounded-2xl w-fit p-4 flex flex-row items-center gap-12" to="/shop/orders" prefetch="viewport">
						<h2>View orders</h2>
					</Link>
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


