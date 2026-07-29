import Button from "@client/components/Button"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { formatDate } from "@client/lib/time"
import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono"
import { useState } from "react"

function OrderBox({ order }: {
	order: Extract<InferResponseType<typeof client.api.shop.orders["$get"]>, { orders: unknown }>["orders"][number]
}) {

	return (
		<div className="border-egg-yellow border-4 p-4 rounded-4xl w-2/3 flex flex-col gap-2 bg-dark-red text-egg-yellow text-4xl">
			<div className="text-beige grid grid-rows-2 grid-cols-2 border-b-beige border-b-2 justify-between grid-flow-col content-center">
				<span>Order placed</span>
				<span>{formatDate(order.placedAt)}</span>

				<span>Order #</span>
				<span className="text-xl">{order.id}</span>

			</div>
			<div className="flex flex-row w-full">
				{order.item.image && (
					<img src={order.item.image} alt={`image of ${order.item.name}`} className="w-1/3" />

				)}

				<div className="grid grid-cols-2 grid-rows-2 grid-flow-col w-full gap-y-8">
					<span>{order.quantity}x {order.item.name}</span>
					<span>Price: {order.price}</span>

					<span className={`w-fit p-2 border-4 rounded-md ${order.fulfilledAt ? "bg-green-400 border-green-500" : "bg-red-400 border-red-500"}`}>{order.fulfilledAt ? "Fulfilled" : "Not fulfilled"}</span>

					{order.trackingId && (
						<a href={order.trackingId} className="underline underline-offset-4 text-emerald-700">tracking link</a>
					)}
				</div>
			</div>


		</div>
	)

}

export default function ShopOrders() {
	const { pushError } = useErrors()
	const { isPending, data: orders } = useQuery({
		queryKey: ["userOrders"],
		queryFn: async () => {
			const res = await client.api.shop.orders.$get()
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}
			const data = await res.json()

			return data.orders
		}
	})

	return (
		<main className="w-full min-h-screen p-4 flex flex-col gap-4 items-center">
			<h1 className="text-7xl">My orders</h1>
			<Button className="text-4xl bg-dark-brown text-light-brown">back to shop</Button>
			<div className="flex flex-col items-center w-full">
				{isPending ? <p>loading...</p> : (
					<>
						{orders && orders.length > 0 ? orders.map((o) => (<OrderBox order={o} />)) : (
							<h2>there are currently no orders</h2>
						)}
					</>
				)}
			</div>
		</main >
	)

}
