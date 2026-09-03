import Button from "@client/components/Button"
import Dialog, { type DialogHandle } from "@client/components/Dialog"
import { AdminShopItemBox } from "@client/components/ShopItemBox"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState, useRef } from "react"
import { useNavigate } from "react-router"

export default function AdminShopItems() {

	const { isPending: regionsPending, data: regions } = useQuery({
		queryKey: ["regions"],
		queryFn: async () => {
			const res = await client.api.shop.regions.$get()

			return (await res.json()).regions
		}
	})

	return (
		<main className="w-full min-h-screen p-4 text-4xl flex flex-col gap-4">

			<div className="flex flex-row justify-between items-center">
				<h1 className="text-4xl">Shop Admin Panel</h1>
				<Button href="/admin/shop/items/new" className="w-fit border-dark-red bg-egg-yellow border-4"><Plus /></Button>

			</div>
			{regionsPending && (
				<p>loading</p>
			)}
			{regions && (

				<RegionalItems regions={regions} />
			)}

		</main>
	)
}

function RegionalItems({ regions }: { regions: { id: string, name: string }[] }) {
	const { pushError } = useErrors()
	const navigate = useNavigate()

	const { isPending: itemsPending, data: shopItems } = useQuery({
		queryKey: ["shopItems"],
		queryFn: async () => {
			const res = await client.api.shop.items.$get({ query: { withRegionAvailabilities: "" } })

			const data = await res.json()
			return data.items as Extract<typeof data["items"][number], { prices: unknown[] }>[]
		}
	})

	const [idToDelete, setIdToDelete] = useState<string>("")

	const { mutate: softDeleteItem } = useMutation({
		mutationFn: async () => {
			const res = await client.api.shop.items[":itemId"].retire.$post({ param: { itemId: idToDelete } })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			navigate("/admin/shop")

		}
	})


	const dialog = useRef<DialogHandle>(null)

	const onDelete = (id: string) => {
		setIdToDelete(id)
		dialog.current?.open()
	}
	return (<>
		<Dialog ref={dialog}>
			<p>Are you sure you want to take this item out of the shop?</p>
			<div className="flex flex-row gap-4">
				<Button onClick={() => {
					softDeleteItem()
					setIdToDelete("")
					dialog.current?.close()
				}} className="bg-dark-red text-beige">Confirm</Button>
				<Button className="bg-beige text-dark-red" onClick={() => dialog.current?.close()}>Cancel</Button>
			</div>
		</Dialog>
		{itemsPending && (
			<p>Loading shop items</p>
		)}
		<div className="grid grid-cols-2 lg:grid-cols-2 2xl:grid-cols-5 gap-4 items-center">
			{shopItems && shopItems?.length != 0 ? shopItems.map(item => (
				<AdminShopItemBox item={item} regions={regions} onDelete={onDelete} key={item.id} />

			)) : (
				<p>No items in shop yet</p>

			)}
		</div>
	</>)

}
