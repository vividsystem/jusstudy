import Button from "@client/components/Button"
import { Input } from "@client/components/Input"
import { client } from "@client/lib/api-client"
import { authClient } from "@client/lib/auth-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono"
import { useState } from "react"
import { Navigate, useParams, useNavigate } from "react-router"


type ShopItem = Extract<InferResponseType<typeof client.api.shop.items[":itemId"]["$get"]>, { item: unknown }>["item"]

export default function BuyItem() {
	const { pushError } = useErrors()
	const navigate = useNavigate()
	const { data } = authClient.useSession()
	const { itemId } = useParams()

	const { /*isPending, /*error,*/ data: shopItem } = useQuery({
		queryKey: ["shopItems", itemId],
		queryFn: async () => {
			if (!itemId) {
				pushError("ItemId undefined")
				throw new Error("ItemId undefined")
			}
			const res = await client.api.shop.items[":itemId"].$get({
				param: { itemId }
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
	if (data == null) {
		return <Navigate to={"/"} />
	}
	if (!itemId) {
		return <Navigate to={"/shop"} />
	}



	return (
		<main className="flex flex-col items-center p-4 w-full min-h-screen">
			{shopItem ? (
				<ShopItemContainer item={shopItem} userCoins={data.user.coins} />
			)
				: (
					<p>loading</p>
				)
			}
		</main >
	)
}

interface ShopItemContainerProps {
	item: ShopItem
	userCoins: number
}
export function ShopItemContainer({ item, userCoins }: ShopItemContainerProps) {

	const navigate = useNavigate()
	const [quantity, setQuantity] = useState(1)
	const [addressId, setAddressId] = useState("")
	const { pushError } = useErrors()
	const { data: addresses } = useQuery({
		queryKey: ["address"],
		queryFn: async () => {
			const res = await client.api.users.addresses.$get()
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}
			const data = await res.json()
			return data.addresses
		},
	})

	const { mutate: buyItem } = useMutation({
		mutationFn: async () => {
			if (addressId == "") {
				pushError("Select a valid address")
				throw new Error("Select a valid address")
			}
			const res = await client.api.shop.orders.$post({
				json: {
					itemId: item.id,
					quantity,
					addressId
				}
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}
		},
	})

	return (
		<div className="grid grid-cols-2 bg-dark-red border-2 border-egg-yellow p-4 rounded-4xl gap-8">
			<div className="flex flex-col">
				{
					item.image != null && (
						<img src={item.image} />
					)
				}
				<h1 className="text-6xl text-egg-yellow">{item.name}</h1>
				<p className="text-beige">{item.description}</p>
			</div>
			<div className="text-beige flex flex-col gap-4">
				<Input type="number" label={"Quantity"} name="orderQuantity" placeholder="1" defaultValue="1" onInput={(v) => setQuantity(Number(v))} step="1" min="1" />
				{/*<Button href={`https://auth.hackclub.com/portal/address?return_to=${encodeURI(clientURL(`/shop/${itemId}`).toString())}`} className="border-beige border-2">Edit Addresses</Button>*/}
				<label htmlFor="address">Address</label>
				<select onChange={(ev) => setAddressId(ev.currentTarget.value)} name="address" defaultValue={""} className="blur hover:blur-none">
					<option value="">Select an address please</option>

					{addresses?.map(addr => (
						<option value={addr.id}>{addr.address_first_line} - {addr.city}</option>
					))}
				</select>
				<Button href={"/addresses"} className="border-beige border-2">Edit Addresses</Button>
				<div className="py-4 px-2 border-2 rounded-2xl">
					<p>Item price: {item.price}</p>
					<p>Order cost: {quantity}x{item.price} = {quantity * item.price}</p>
				</div>
				<Button onClick={(ev) => {
					ev.preventDefault()
					buyItem()
					navigate("/shop")

				}} className="border-egg-yellow border-2 disabled:bg-beige disabled:text-light-brown" disabled={userCoins < (quantity * item.price)}>Buy</Button>
			</div>
		</div>
	)
}
