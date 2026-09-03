import { Pencil, Trash } from "lucide-react";
import Button from "./Button";
interface Availability {
	quantity: number | null;
	price: number;
	createdAt: string;
	itemId: string | null;
	regionId: string | null;
	available: boolean | null;
}
interface AdminShopItemBoxProps {
	item: {
		id: string;
		name: string;
		description: string;
		prices: Availability[];
		image: string | null;
	}
	regions: { id: string, name: string }[]
	onDelete: (id: string) => void
}

export function AdminShopItemBox(props: AdminShopItemBoxProps) {
	return (
		<div className="bg-dark-red border-2 border-egg-yellow p-4 flex items-center relative rounded-4xl gap-4">
			<div className="rounded-md overflow-clip">
				{props.item.image && (
					<img src={props.item.image} alt={`Image of the shop item "${props.item.name}"`} className="aspect-square h-fit" />
				)}
			</div>
			<div>
				<div className="h-1/2 flex flex-col items-start">
					<h2 className="text-egg-yellow text-2xl">{props.item.name}</h2>
					<p className="text-xl text-beige">{props.item.description}</p>
					{props.item.prices.length !== 0 ? (<>

						<p className="text-xl text-beige">Qty: {props.item.prices.map(p => `${p.quantity || "∞"} (${props.regions.find(r => r.id === p.regionId)!.name})`) || "∞"}</p>
						<p className="text-xl text-beige">Price: {props.item.prices.map(p => `${p.price} (${props.regions.find(r => r.id === p.regionId)!.name})`)}</p>
					</>) : (
						<p className="text-xl text-red-400 underline">not available in any regions</p>
					)}

				</div>
				<div className="flex flex-row gap-4">
					<Button className="text-dark-red bg-egg-yellow" href={`/admin/shop/items/${props.item.id}/edit`}><Pencil /></Button>
					<Button className="text-dark-red bg-egg-yellow" onClick={() => props.onDelete(props.item.id)}><Trash /></Button>
				</div>
			</div>

		</div>
	)
}

interface ShopItemBoxProps {
	item: {
		id: string;
		name: string;
		description: string;
		price: number;
		quantity: number | null;
		image: string | null;
	}
}

export default function ShopItemBox(props: ShopItemBoxProps) {
	return (
		<div className={`border-2 border-egg-yellow p-4 flex flex-col-reverse items-center relative rounded-4xl ${props.item.quantity == 0 ? "bg-beige" : "bg-dark-red"}`}>
			<Button href={`/shop/${props.item.id}`} className="translate-y-1/2 bottom-0 w-fit bg-egg-yellow border-dark-red border-3 not-disabled:pointer-none:bg-beige disabled:bg-dark-brown" disabled={props.item.quantity == 0}>{props.item.quantity === 0 ? "Sold out" : `${props.item.price} Books`}</Button>

			<div className="flex flex-col items-start w-full">
				<h2 className="text-egg-yellow text-2xl">{props.item.name}</h2>
				<p className="text-xl text-beige">{props.item.description}</p>

			</div>

			{props.item.image && (
				<div className="max-h-1/2 rounded-lg overflow-clip">
					<img src={props.item.image} alt={`Image of the shop item "${props.item.name}"`} className="aspect-square" />
				</div>
			)}
		</div>
	)


}
