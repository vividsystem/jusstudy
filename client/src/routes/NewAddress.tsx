import Button from "@client/components/Button";
import { Input } from "@client/components/Input";
import { client } from "@client/lib/api-client";
import { NewAddressSchema } from "@shared/validation/addresses";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import z from "zod";

export default function NewAddress() {
	const navigate = useNavigate()
	const [form, setForm] = useState<Partial<z.infer<typeof NewAddressSchema>>>({})
	const { mutate } = useMutation({
		mutationFn: async () => {
			const parsed = NewAddressSchema.safeParse(form)
			if (!parsed.success) {
				throw z.formatError(parsed.error)
			}
			const res = await client.api.users.addresses.$post({
				json: {
					...parsed.data
				}
			})
			if (!res.ok) {
				const data = await res.json()
				throw data.message
			}
			return res
		},
		throwOnError: true
	})
	return (
		<main className="flex flex-col gap-4">
			<div className="flex flex-row gap-4">
				<Input label={"Firstname"} placeholder="John" onInput={(v) => setForm(form => ({ ...form, firstname: v }))} type="text" name="firstname" />
				<Input label={"Lastname"} placeholder="Doe" onInput={(v) => setForm(form => ({ ...form, lastname: v }))} type="text" name="lastname" />
			</div>
			<Input label={"Address Line 1"} placeholder="Duhstreet 1" onInput={(v) => setForm(form => ({ ...form, address_first_line: v }))} type="text" name="faddress_first_line" />
			<Input label={"Address Line 2"} placeholder="c/o Orpheus" onInput={(v) => setForm(form => ({ ...form, address_second_line: v }))} type="text" name="address_second_line" />
			<Input label={"City"} placeholder="New York" onInput={(v) => setForm(form => ({ ...form, city: v }))} type="text" name="city" />
			<Input label={"Postal Code"} placeholder="12345" onInput={(v) => setForm(form => ({ ...form, postal_code: v }))} type="text" name="postal_code" />
			<Input label={"State"} placeholder="New Jersey" onInput={(v) => setForm(form => ({ ...form, state: v }))} type="text" name="state" />
			<Input label={"Country"} placeholder="United States of America" onInput={(v) => setForm(form => ({ ...form, country: v }))} type="text" name="country" />
			<Button onClick={() => {
				console.log(form)
				mutate()
				navigate("/addresses")
			}} className="border-egg-yellow border-2 bg-dark-red">Create Address</Button>

		</main>
	)
}
