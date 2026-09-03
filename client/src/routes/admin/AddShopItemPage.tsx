import ShopItemForm, { OptionsForm, RegionForm, type NewOption } from "@client/components/admin/Shop"
import Button from "@client/components/Button"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import type { AddRegionAvailability } from "@shared/validation"
import { NewShopItemRequestSchema } from "@shared/validation/shop"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router"
import z from "zod"


export default function AddShopItemPage() {

	const { pushError } = useErrors()
	const navigate = useNavigate()
	const [opts, setOpts] = useState<NewOption[]>([])
	const [newItem, setNewItem] = useState<Partial<z.infer<typeof NewShopItemRequestSchema>>>({})
	const [selectedRegions, setSelectedRegions] = useState<AddRegionAvailability[]>([])
	const { data: regions } = useQuery({
		queryKey: ["shopRegions"],
		queryFn: async () => {
			const res = await client.api.shop.regions.$get()

			const data = await res.json()
			return data.regions
		}
	})

	const { mutate } = useMutation({
		mutationFn: async () => {

			const parsed = NewShopItemRequestSchema.safeParse({
				...newItem,
				regions: Object.fromEntries(selectedRegions.map(({ regionId, ...r }) => [regionId, r])),
				options: opts
			})
			if (!parsed.success) {
				const e = z.prettifyError(parsed.error)
				pushError(e.toString())

				throw e
			}

			const res = await client.api.shop.items.$post({ json: parsed.data })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			navigate("/admin/shop/items")
		}
	})
	return (
		<main className="w-full text-4xl flex flex-col items-center gap-4 p-4 relative">

			<ShopItemForm item={newItem} setItem={setNewItem} />

			{regions ? (<>
				<RegionForm regions={regions} addedAvailabilities={selectedRegions} setAddedAvailabilities={setSelectedRegions} />
				<OptionsForm newOpts={opts} setNewOpts={setOpts} addedAvailabilities={selectedRegions} regions={regions} />
			</>) : (<p>loading regions...</p>)}

			<Button onClick={() => mutate()}>Save</Button>

		</main >

	)
}
