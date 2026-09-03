import ShopItemForm, { RegionForm, OptionsForm, type NewOption, type NewVariant } from "@client/components/admin/Shop"
import Button from "@client/components/Button"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router"
import type { AddRegionAvailability, AddVariantRegionAvailability, ShopItemWithOptionsPrices } from "@shared/validation"

export default function EditShopItemPage() {
	const { id } = useParams()
	const { pushError } = useErrors()
	const navigate = useNavigate()



	const { isPending, /*error,*/ data: shopItem } = useQuery({
		queryKey: ["shopItems", id],
		queryFn: async () => {
			if (!id) {
				pushError("ItemId undefined")
				throw new Error("ItemId undefined")
			}
			const res = await client.api.shop.items[":itemId"].$get({
				param: { itemId: id }
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				if (res.status == 404) {
					navigate("/admin/shop/items")
				}
				throw new Error(data.message)
			}

			const itemData = await res.json()

			const regionsRes = await client.api.shop.items[":itemId"].availabilities.$get({ param: { itemId: id } })
			const avData = await regionsRes.json()
			return { ...itemData.item, createdAt: new Date(itemData.item.createdAt), availabilities: avData.availabilities }
		},
	})

	if (!isPending && !shopItem || !id) {
		return <Navigate to={"/admin/shop"} />
	}


	return (
		<main className="w-full text-4xl flex flex-col items-center gap-4 p-4 relative">
			{
				shopItem ? <EditItemForm item={shopItem} availabilities={shopItem.availabilities} /> :
					(<p>loading</p>)
			}

		</main >
	)
}

function EditItemForm(props: { item: ShopItemWithOptionsPrices, availabilities: AddRegionAvailability[] }) {
	const { pushError } = useErrors()
	const navigate = useNavigate()

	const [edited, setEdited] = useState<Partial<ShopItemWithOptionsPrices>>(props.item)
	const [selectedRegions, setSelectedRegions] = useState<AddRegionAvailability[]>([])
	const [newOptions, setNewOptions] = useState<NewOption[]>([])
	const [newVariants, setNewVariants] = useState<NewVariant[]>([])
	const [newVariantAvailabilities, setNewVariantAvailabilities] = useState<({ variantId: string } & AddVariantRegionAvailability)[]>([])

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
			const res = await client.api.shop.items[":itemId"].$patch({ json: edited, param: { itemId: props.item.id } })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			for (const av of selectedRegions) {
				const avRes = await client.api.shop.items[":itemId"].availabilities.$post({ json: av, param: { itemId: props.item.id } })
				if (!res.ok) {
					const data = await avRes.json()
					pushError(data.message)
					throw new Error(data.message)
				}
			}

			for (const opt of newOptions) {
				const optRes = await client.api.shop.items[":itemId"].options.$post({ json: opt, param: { itemId: props.item.id } })
				if (!optRes.ok) {
					const data = await optRes.json()
					pushError(data.message)
				}

			}

			for (const variant of newVariants) {
				const variantRes = await client.api.shop.options[":optionId"].variants.$post({ json: variant, param: { optionId: variant.optionId } })
				if (!variantRes.ok) {
					const data = await variantRes.json()
					pushError(data.message)
					throw new Error(data.message)
				}
			}

			for (const variantAv of newVariantAvailabilities) {
				const variantAvRes = await client.api.shop.variants[":variantId"].availabilities.$post({ json: variantAv, param: { variantId: variantAv.variantId } })
			}




			navigate("/admin/shop")
		}
	})
	return (
		<>

			<ShopItemForm item={edited} setItem={setEdited} />
			{regions ? (<>
				<RegionForm
					regions={regions}
					availabilities={props.availabilities}
					addedAvailabilities={selectedRegions}
					setAddedAvailabilities={setSelectedRegions}
				/>

				<OptionsForm
					newOpts={newOptions}
					setNewOpts={setNewOptions}
					opts={props.item.options}
					newVariants={newVariants}
					setNewVariants={setNewVariants}
					newVariantAvailabilities={newVariantAvailabilities}
					setNewVariantAvailabilities={setNewVariantAvailabilities}
					addedAvailabilities={[...selectedRegions, ...props.availabilities]}
					regions={regions}
				/>
			</>) : (<p>loading regions...</p>)}

			<Button onClick={() => mutate()}>Save</Button>

		</>

	)
}
