import Button from "@client/components/Button";

export default function AdminShopPage() {
	return (
		<main className="flex gap-4 w-full min-h-screen p-4">
			<Button
				href="/admin/shop/items"
				className="border-dark-red border-4 bg-egg-yellow h-fit w-fit"
			>manage items</Button>
			<Button
				href="/admin/shop/regions"
				className="border-dark-red border-4 bg-egg-yellow h-fit w-fit"
			>manage regions</Button>
		</main >
	)
}
