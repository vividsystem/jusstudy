import { client } from "@client/lib/api-client"
import { useQuery } from "@tanstack/react-query"

export default function ManageAddresses() {
	const { data, isPending } = useQuery({
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
	return (
		<main>
			{isPending && (<p>loading</p>)}
			{(data && data?.length > 0) ?
				(
					data.map(addr => (
						<div>
							<h1>{addr.firstname} {addr.lastname}</h1>
							<p>
								{addr.address_first_line} <br />
								{addr.address_second_line != null ? (<>{addr.address_second_line} <br /></>) : (<></>)}
								{addr.city} {addr.postal_code} <br />
								{addr.state} - {addr.country} <br />

							</p>
						</div>
					))
				) : <p>no addresses</p>
			}
		</main>
	)
}
