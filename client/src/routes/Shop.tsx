import ShopItemBox from "@client/components/ShopItemBox"
import { client } from "@client/lib/api-client"
import { authClient } from "@client/lib/auth-client"
import { useQuery } from "@tanstack/react-query"
import { Navigate } from "react-router"

export default function Shop() {

	const { data } = authClient.useSession()
	if (data == null) {
		return <Navigate to={"/"} />
	}
	const { isPending, /*error,*/ data: shopItems } = useQuery({
		queryKey: ["shopItems"],
		queryFn: async () => {
			const res = await client.api.shop.items.$get()
			const data = await res.json()
			return data.shopItems
		},
		throwOnError: true
	})
	return (
		<main className="w-full min-h-screen p-4">
			<div className="flex flex-row py-4 justify-between">
				<h1 className="text-9xl">Shop</h1>
				<span>{data.user.coins} Books</span>
			</div>
			{isPending && (
				<p>Loading shop items</p>
			)}
			<div className="grid grid-cols-2">
				{shopItems && shopItems?.length != 0 ? shopItems.map(item => (
					<ShopItemBox item={item} />

				)) : (
					<p>No items in shop yet</p>

				)}
			</div>
		</main>
	)
}
