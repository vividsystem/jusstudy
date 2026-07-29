import ShopItemBox from "@client/components/ShopItemBox"
import { client } from "@client/lib/api-client"
import { authClient } from "@client/lib/auth-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono"
import { ArrowDown, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { Navigate } from "react-router"


export default function Shop() {
	const { data } = authClient.useSession()
	if (data == null) {
		return <Navigate to={"/"} />
	}

	return <Page userCoins={data.user.coins} />
}
function Page({ userCoins }: { userCoins: number }) {
	const { isPending, /*error,*/ data: shopItems } = useQuery({
		queryKey: ["shopItems"],
		queryFn: async () => {
			const res = await client.api.shop.items.$get()
			const data = await res.json()
			return data.shopItems
		}
	})
	return (
		<main className="w-full min-h-screen p-4">
			<div className="flex flex-row py-4 justify-between items-center">
				<h1 className="text-9xl">Shop</h1>

				<a className="text-4xl bg-dark-brown border-egg-yellow border-4 text-beige rounded-2xl w-fit p-4 flex flex-row items-center gap-12" href="/shop/orders">
					<h2 className="text-6xl">View orders</h2>
				</a>
				<span className="text-4xl">{userCoins} Books</span>
			</div>

			{
				isPending && (
					<p>Loading shop items</p>
				)
			}
			<div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-5 gap-4 items-center">
				{shopItems && shopItems?.length != 0 ? shopItems.map(item => (
					<ShopItemBox item={item} key={item.id} />

				)) : (
					<p>No items in shop yet</p>

				)}
			</div>
		</main >
	)
}


