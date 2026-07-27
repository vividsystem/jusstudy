import Button from "@client/components/Button"
import ConfirmDialog from "@client/components/ConfirmDialog"
import { AdminShopItemBox } from "@client/components/ShopItemBox"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"

export default function AdminShopPage() {
	const { pushError } = useErrors()
	const navigate = useNavigate()

	const { isPending, /*error,*/ data: shopItems } = useQuery({
		queryKey: ["shopItems"],
		queryFn: async () => {
			const res = await client.api.shop.items.$get()
			const data = await res.json()
			return data.shopItems
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

	const [showConfirm, setShowConfirm] = useState<boolean>(false)

	const onDelete = (id: string) => {
		setIdToDelete(id)
		setShowConfirm(true)
	}

	return (
		<main className="w-full min-h-screen p-4 text-4xl flex flex-col gap-4">
			<ConfirmDialog description="Are you sure you want to take this item out of the shop?" onConfirm={() => {
				softDeleteItem()
				setIdToDelete("")
			}} setShow={setShowConfirm} show={showConfirm} />
			<div className="flex flex-row justify-between items-center">
				<h1 className="text-4xl">Shop Admin Panel</h1>
				<Button href="/admin/shop/new" className="w-fit border-dark-red bg-egg-yellow border-4"><Plus /></Button>
			</div>
			{isPending && (
				<p>Loading shop items</p>
			)}
			<div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-5 gap-4 items-center">
				{shopItems && shopItems?.length != 0 ? shopItems.map(item => (
					<AdminShopItemBox item={item} onDelete={onDelete} />

				)) : (
					<p>No items in shop yet</p>

				)}
			</div>

		</main>
	)
}
