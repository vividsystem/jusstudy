import ShopItemForm, { OptionsForm, RegionForm, type NewOption } from "@client/components/admin/Shop"
import Button from "@client/components/Button"
import { ItemImageUpload } from "@client/components/FileUpload"
import { client } from "@client/lib/api-client"
import type { AddRegionAvailability } from "@shared/validation"
import { NewShopItemRequestSchema } from "@shared/validation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router"
import z from "zod"


export default function AddShopItemPage() {
	const [file, setFile] = useState<File>()
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
				throw new Error(z.prettifyError(parsed.error))
			}
			if (!file) {
				throw new Error("An Icon needs to be added!")
			}

			const res = await client.api.shop.items.$post({ json: parsed.data })
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message)
			}

			const data = await res.json()

			await client.api.shop.items[":id"].image.$put({ param: { id: data.shopItem.id }, form: { image: file } })

			navigate("/admin/shop/items")
		}
	})
	return (
		<main className="w-full text-4xl flex flex-col items-center gap-4 p-4 relative">
			<ItemImageUpload onUpdate={setFile} />

			<ShopItemForm item={newItem} setItem={setNewItem} />

			{regions ? (<>
				<RegionForm regions={regions} addedAvailabilities={selectedRegions} setAddedAvailabilities={setSelectedRegions} />
				<OptionsForm newOpts={opts} setNewOpts={setOpts} addedAvailabilities={selectedRegions} regions={regions} />
			</>) : (<p>loading regions...</p>)}

			<Button onClick={() => mutate()}>Save</Button>

		</main >

	)
}
