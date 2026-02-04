import Button from "@client/components/Button"
import { Input } from "@client/components/Input"
import { client } from "@client/lib/api-client"
import { authClient } from "@client/lib/auth-client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Navigate, useParams, useNavigate } from "react-router"

export default function BuyItem() {
	const navigate = useNavigate()
	const { data } = authClient.useSession()
	if (data == null) {
		return <Navigate to={"/"} />
	}
	const { itemId } = useParams()
	const [quantity, setQuantity] = useState(1)
	const [addressId, setAddressId] = useState("")
	if (!itemId) {
		return <Navigate to={"/shop"} />
	}
	const { /*isPending, /*error,*/ data: shopItem } = useQuery({
		queryKey: ["shopItems", itemId],
		queryFn: async () => {
			const res = await client.api.shop.items[":itemId"].$get({
				param: { itemId }
			})
			if (!res.ok) {
				if (res.status == 404) {
					navigate("/shop")
				}
				const data = await res.json()
				throw new Error(data.message)
			}

			const data = await res.json()
			return data.item
		},
		throwOnError: true
	})
	const { data: addresses } = useQuery({
		queryKey: ["address"],
		queryFn: async () => {
			const res = await client.api.users.addresses.$get()
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message)
			}
			const data = await res.json()
			return data.addresses
		},
		throwOnError: true
	})

	const { isError: _isMutationError, isSuccess: _isMutationSuccess, mutate: buyItem } = useMutation({
		mutationFn: async () => {
			if (addressId == "") {
				throw new Error("Select a valid address")
			}
			const res = await client.api.shop.orders.$post({
				json: {
					itemId,
					quantity,
					addressId
				}
			})
		},
		throwOnError: true
	})

	return (
		<main className="flex flex-col items-center p-4 w-full min-h-screen">
			{shopItem ? (
				<div className="grid grid-cols-2 bg-dark-red border-2 border-egg-yellow p-4 rounded-4xl gap-8">
					<div className="flex flex-col">
						{
							shopItem!.image != null && (
								<img src={shopItem.image} />
							)
						}
						<h1 className="text-6xl text-egg-yellow">{shopItem?.name}</h1>
						<p className="text-beige">{shopItem.description}</p>
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
							<p>Item price: {shopItem.price}</p>
							<p>Order cost: {quantity}x{shopItem.price} = {quantity * shopItem.price}</p>
						</div>
						<Button onClick={(ev) => {
							ev.preventDefault()
							buyItem()
							navigate("/shop")

						}} className="border-egg-yellow border-2 disabled:bg-beige disabled:text-light-brown" disabled={data.user.coins < (quantity * shopItem.price)}>Buy</Button>
					</div>
				</div>
			)
				: (
					<p>loading</p>

				)
			}
		</main >
	)
}
