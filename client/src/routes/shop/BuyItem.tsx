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
	const { data } = authClient.useSession()
	const { itemId } = useParams()

	if (data == null) {
		return <Navigate to={"/"} />
	} else if (!data.user.regionId) {
		return <Navigate to={"/onboarding"} />
	} else if (!itemId) {
		return <Navigate to={"/shop"} />
	}



	return (<RegionWrapper regionId={data.user.regionId} itemId={itemId} userCoins={data.user.coins} />)
}

function RegionWrapper({ regionId, itemId, userCoins }: { regionId: string, itemId: string, userCoins: number }) {
	const { pushError } = useErrors()
	const navigate = useNavigate()
	const { data: item } = useQuery({
		queryKey: ["shopItem", itemId],
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

	if (item && (!item.availabilities.some(a => a.regionId === regionId) || !item.availabilities.find(a => a.regionId === regionId)!.available)) {
		pushError("Product not available in your region.")
		return <Navigate to={"/shop"} />
	}

	return (
		<main className="flex flex-col items-center p-4 w-full min-h-screen">
			{item ? (
				<ShopItemContainer item={item} regionId={regionId} userCoins={userCoins} availability={item.availabilities.find(a => a.regionId === regionId)!} />
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
	availability: ShopItem["availabilities"][number]
	userCoins: number
	regionId: string
}
export function ShopItemContainer({ item, userCoins, regionId, availability }: ShopItemContainerProps) {

	const navigate = useNavigate()
	const [quantity, setQuantity] = useState(1)
	const [opts, setOpts] = useState<{ optionId: string, variantId: string, additionalPrice: number }[]>([])
	const [variantPrice, setVariantPrice] = useState(0)


	const setOption = (oId: string, vId: string) => {
		const opt = opts.find((o) => o.optionId === oId)
		const addPrice = item.options.find((o) => o.id === oId)?.variants.find((v) => v.id === vId)?.prices[regionId]
		if (!opt) {
			setOpts((prev) => [...prev, { optionId: oId, variantId: vId, additionalPrice: (addPrice || 0) }])
		} else {
			setOpts((prev) => prev.map((ov) => ov.optionId === oId ? { ...ov, variantId: vId } : ov))
		}

		setVariantPrice(opts.reduce((acc, o) => acc + o.additionalPrice, 0))
	}


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

			if (opts.length !== item.options.length) {
				pushError("Select variants for all options!")
				throw new Error("Select variants for all options!")

			}

			const optRecord = opts.reduce((rec, opt) => {
				rec[opt.optionId] = opt.variantId
				return rec
			}, {} as Record<string, string>)

			if (Object.values(optRecord).some((v) => v === "")) {
				pushError("Select variants for all options!")
				throw new Error("Select variants for all options!")
			}



			const res = await client.api.shop.orders.$post({
				json: {
					itemId: item.id,
					regionId,
					quantity,
					optionVariants: optRecord,
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

				{item.options.map((o) => (
					<>
						<label htmlFor={o.id} className="text-beige">{o.name}</label>
						<select
							name={o.id}
							className="border border-beige rounded-sm p-1 text-beige"
							onChange={(ev) => setOption(o.id, ev.currentTarget.value)}
						>

							<option value="">Select a variant please</option>
							{o.variants.map((v) => (
								<option value={v.id}>{v.name} (+ {v.prices[regionId] || 0} Books)</option>
							))}
						</select>
					</>
				))}
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
					<p>Item price: {availability.price}</p>
					<p>Order cost: {quantity}x{availability.price + variantPrice} = {quantity * (availability.price + variantPrice)}</p>
				</div>
				<Button onClick={(ev) => {
					ev.preventDefault()
					buyItem()
					navigate("/shop")

				}} className="border-egg-yellow border-2 disabled:bg-beige disabled:text-light-brown" disabled={userCoins < (quantity * (availability.price + variantPrice))}>Buy</Button>
			</div >
		</div>
	)
}
