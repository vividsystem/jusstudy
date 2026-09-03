import Button from "@client/components/Button";
import { Input } from "@client/components/Input";
import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { useMutation, useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react";
import { useState } from "react";

export default function AdminShopRegions() {
	const { pushError } = useErrors()
	const { data: regions, refetch } = useQuery({
		queryKey: ["regions"],
		queryFn: async () => {
			const res = await client.api.shop.regions.$get()

			return (await res.json()).regions

		}
	})
	const [name, setName] = useState("")

	const { mutate: addRegion } = useMutation({
		mutationFn: async () => {
			if (name === "") return pushError("Name must be specified")
			const res = await client.api.shop.regions.$post({ json: { name } })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)

				throw new Error(data.message)
			}
			const data = await res.json()
			refetch()
			return data.region
		}
	})


	return (
		<main className="w-full min-h-screen p-4">
			<h1 className="text-4xl">Regions</h1>
			<div className="flex items-center gap-4">
				<Input type="text" placeholder="LATAM" className="w-fit" label="Name" onInput={(v) => setName(v)} name="name" />
				<Button onClick={() => {
					addRegion()
					setName("")
				}}><Plus /> Add Region</Button>
			</div>
			<div className="flex flex-col">
				{regions?.map(r => (
					<p key={r.id}>{r.name}</p>
				))}

			</div>

		</main >
	)
}
