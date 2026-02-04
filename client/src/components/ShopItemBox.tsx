import Button from "./Button";

interface ShopItemBoxProps {
	item: {
		id: string;
		quantity: number | null;
		name: string;
		description: string;
		price: number;
		image: string | null;
	}
}
export default function ShopItemBox(props: ShopItemBoxProps) {
	return (
		<div className="bg-dark-red border-2 border-egg-yellow p-2 flex flex-col-reverse items-center relative rounded-4xl">
			<Button href={`/shop/${props.item.id}`} className="translate-y-1/2 bottom-0 bg-egg-yellow border-dark-red border-3 pointer-none:bg-beige">{props.item.price} Books</Button>

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
