import Button from "@client/components/Button"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"

export default function ManageAddresses() {
	const { pushError } = useErrors()
	const { data, isPending } = useQuery({
		queryKey: ["address"],
		queryFn: async () => {
			const res = await client.api.users.addresses.$get()
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message);
			}
			const data = await res.json()
			return data.addresses
		},
	})
	return (
		<main className="w-full min-h-screen">
			<div className="flex flex-row items-center justify-between py-4 pr-4">
				<h1 className="text-7xl">Addresses</h1>
				<Button className="border-dark-red border-4 w-fit h-fit bg-egg-yellow" href="/addresses/new"><Plus className="size-8" /></Button>
			</div>

			{isPending && (<p>loading</p>)}
			{(data && data?.length > 0) ?
				(
					data.map(addr => (
						<div className="border-4 border-dark-red p-4 bg-egg-yellow w-fit rounded-4xl text-3xl">
							<h2 className="text-5xl">{addr.firstname} {addr.lastname}</h2>
							<p>
								{addr.address_first_line} <br />
								{addr.address_second_line != null ? (<>{addr.address_second_line} <br /></>) : (<></>)}
								{addr.city} {addr.postal_code} <br />
								{addr.state} - {addr.country} <br />

							</p>
						</div>
					))
				) : <p className="text-4xl text-beige">no addresses found. <a href="/addresses/new" className="underline underline-offset-2 bold">create a new one</a></p>
			}
		</main>
	)
}
