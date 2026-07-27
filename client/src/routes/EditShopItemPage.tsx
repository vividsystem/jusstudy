import Button from "@client/components/Button"
import { CheckableInput, Input } from "@client/components/Input"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import type { UpdateShopItemRequest } from "@shared/validation/shop"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono"
import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router"
import type z from "zod"

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
					navigate("/shop")
				}
				throw new Error(data.message)
			}

			const data = await res.json()
			return data.item
		},
	})

	if (!isPending && !shopItem || !id) {
		return <Navigate to={"/admin/shop"} />
	}


	const { mutate } = useMutation({
		mutationFn: async (item: z.infer<typeof UpdateShopItemRequest>) => {
			if (item.quantity == null) item.quantity = undefined
			if (item.image == null) item.image = undefined
			const res = await client.api.shop.items[":itemId"].$patch({ json: item, param: { itemId: id } })
		}
	})

	return (
		<main>
			{
				shopItem ? <EditItemForm item={shopItem} /> :
					(<p>loading</p>)
			}
		</main >
	)
}


function EditItemForm(props: { item: Extract<InferResponseType<typeof client.api.shop.items[":itemId"]["$get"]>, { item: unknown }>["item"] }) {
	const { pushError } = useErrors()
	const navigate = useNavigate()

	const [edited, setEdited] = useState<Partial<typeof props.item>>(props.item)
	const { mutate } = useMutation({
		mutationFn: async () => {
			const res = await client.api.shop.items[":itemId"].$patch({ json: edited, param: { itemId: props.item.id } })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}


			navigate("/admin/shop")
		}
	})
	return (
		<form onSubmit={(e) => {
			e.preventDefault()
			mutate()
		}}>

			<Input
				label="Name"
				placeholder="amazing product"
				type="text"
				name="name"
				defaultValue={edited.name}
				onInput={(v) => { setEdited((p) => ({ ...p, name: v })) }}
			/>
			<Input
				label="Description"
				placeholder="a nice product description"
				type="text"
				name="desc"
				defaultValue={edited.description}
				onInput={(v) => { setEdited((p) => ({ ...p, description: v })) }}
			/>
			<Input
				label="Price"
				placeholder="9999"
				type="number"
				name="price"
				defaultValue={edited.price}
				onInput={(v) => { setEdited((p) => ({ ...p, price: Number(v) })) }}
			/>
			<Input
				label="Image URL"
				placeholder="https://example.com/image.png"
				type="text"
				name="image"
				defaultValue={edited.image ?? undefined}
				onInput={(v) => { setEdited((p) => ({ ...p, image: v })) }}
			/>
			<CheckableInput
				checkboxLabel={"Limit quantity?"}
				label="Quantity"
				placeholder="200"
				type="number"
				name="quantity"
				defaultValue={edited.quantity ?? undefined}
				onInput={(v) => { setEdited((p) => ({ ...p, quantity: v ? Number(v) : undefined })) }}
			/>

			<Button type="submit">Save</Button>

		</form>

	)
}
