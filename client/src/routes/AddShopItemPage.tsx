import Button from "@client/components/Button"
import { CheckableInput, Input } from "@client/components/Input"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { NewShopItemRequest } from "@shared/validation/shop"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router"
import z from "zod"

export default function AddShopItemPage() {

	const { pushError } = useErrors()
	const navigate = useNavigate()

	const [newItem, setNewItem] = useState<Partial<z.infer<typeof NewShopItemRequest>>>({})
	const { mutate } = useMutation({
		mutationFn: async () => {

			const parsed = NewShopItemRequest.safeParse(newItem)
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
				defaultValue={newItem.name}
				onInput={(v) => { setNewItem((p) => ({ ...p, name: v })) }}
			/>
			<Input
				label="Description"
				placeholder="a nice product description"
				type="text"
				name="desc"
				defaultValue={newItem.description}
				onInput={(v) => { setNewItem((p) => ({ ...p, description: v })) }}
			/>
			<Input
				label="Price"
				placeholder="9999"
				type="number"
				name="price"
				defaultValue={newItem.price}
				onInput={(v) => { setNewItem((p) => ({ ...p, price: Number(v) })) }}
			/>
			<Input
				label="Image URL"
				placeholder="https://example.com/image.png"
				type="text"
				name="image"
				defaultValue={newItem.image ?? undefined}
				onInput={(v) => { setNewItem((p) => ({ ...p, image: v })) }}
			/>
			<CheckableInput
				checkboxLabel={"Limit quantity?"}
				label="Quantity"
				placeholder="200"
				type="number"
				name="quantity"
				defaultValue={newItem.quantity ?? undefined}
				onInput={(v) => { setNewItem((p) => ({ ...p, quantity: v ? Number(v) : undefined })) }}
			/>

			<Button type="submit">Save</Button>

		</form >

	)
}
