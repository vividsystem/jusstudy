import { Pencil, Trash } from "lucide-react";
import Button from "./Button";

interface ShopItemBoxProps {
	item: {
		id: string;
		quantity: number | null;
		name: string;
		description: string;
		basePrice: number;
		image: string | null;
	}
}

export function AdminShopItemBox(props: ShopItemBoxProps & { onDelete: (id: string) => void }) {
	return (
		<div className="bg-dark-red border-2 border-egg-yellow p-4 flex flex-col items-center relative rounded-4xl gap-4">
			{props.item.image && (
				<img src={props.item.image} alt={`Image of the shop item "${props.item.name}"`} />
			)}
			<div className="h-1/2 flex flex-col items-start">
				<h2 className="text-egg-yellow text-2xl">{props.item.name}</h2>
				<p className="text-xl text-beige">{props.item.description}</p>
				<p className="text-xl text-beige">Qty: {props.item.quantity || "∞"}</p>
				<p className="text-xl text-beige">Price: {props.item.basePrice}</p>

			</div>
			<div className="flex flex-row gap-4">
				<Button className="text-dark-red bg-egg-yellow" href={`/admin/shop/item/${props.item.id}/edit`}><Pencil /></Button>
				<Button className="text-dark-red bg-egg-yellow" onClick={() => props.onDelete(props.item.id)}><Trash /></Button>
			</div>

		</div>
	)
}

export default function ShopItemBox(props: ShopItemBoxProps) {
	return (
		<div className={`border-2 border-egg-yellow p-4 flex flex-col-reverse items-center relative rounded-4xl ${props.item.quantity == 0 ? "bg-beige" : "bg-dark-red"}`}>
			<Button href={`/shop/${props.item.id}`} className="translate-y-1/2 bottom-0 bg-egg-yellow border-dark-red border-3 not-disabled:pointer-none:bg-beige disabled:bg-dark-brown" disabled={props.item.quantity == 0}>{props.item.quantity === 0 ? "Sold out" : `${props.item.basePrice} Books`}</Button>

			<div className="h-1/2 flex flex-col items-start">
				<h2 className="text-egg-yellow text-2xl">{props.item.name}</h2>
				<p className="text-xl text-beige">{props.item.description}</p>

			</div>

			{props.item.image && (
				<img src={props.item.image} alt={`Image of the shop item "${props.item.name}"`} />
			)}
		</div>
	)


}
