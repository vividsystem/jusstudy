import Button from "@client/components/Button";
import { Input } from "@client/components/Input";
import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { NewAddressSchema } from "@shared/validation/addresses";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import z from "zod";

export default function NewAddress() {
	const navigate = useNavigate()
	const { pushError } = useErrors()
	const [form, setForm] = useState<Partial<z.infer<typeof NewAddressSchema>>>({})
	const { mutate } = useMutation({
		mutationFn: async () => {
			const parsed = NewAddressSchema.safeParse(form)
			if (!parsed.success) {
				pushError(z.formatError(parsed.error).toString())
				throw parsed.error
			}
			const res = await client.api.users.addresses.$post({
				json: {
					...parsed.data
				}
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}
			return res
		},
	})
	return (
		<form className="flex flex-col gap-4" autoComplete="on">
			<fieldset className="flex flex-row gap-4">
				<Input
					label={"Firstname"}
					placeholder="John"
					onInput={(v) => setForm(form => ({ ...form, firstname: v }))}
					type="text"
					name="firstname"
					id="firstname"
					autocomplete="given-name"
				/>
				<Input
					label={"Lastname"}
					placeholder="Doe"
					onInput={(v) => setForm(form => ({ ...form, lastname: v }))}
					type="text"
					name="lastname"
					id="lastname"
					autocomplete="family-name"
				/>
			</fieldset>
			<Input
				label={"Address Line 1"}
				placeholder="Duhstreet 1"
				onInput={(v) => setForm(form => ({ ...form, address_first_line: v }))}
				type="text"
				name="address_first_line"
				id="address_first_line"
				autocomplete="shipping address-line"
			/>
			<Input
				label={"Address Line 2"}
				placeholder="c/o Orpheus"
				onInput={(v) => setForm(form => ({ ...form, address_second_line: v }))}
				type="text"
				name="address_second_line"
				id="address_second_line"
				autocomplete="shipping address-line2"
			/>
			<Input
				label={"City"}
				placeholder="New York"
				onInput={(v) => setForm(form => ({ ...form, city: v }))}
				type="text"
				name="city"
				id="city"
				autocomplete="shipping address-level2"
			/>
			<Input
				label={"Postal Code"}
				placeholder="12345"
				onInput={(v) => setForm(form => ({ ...form, postal_code: v }))}
				type="text"
				name="postal_code"
				autocomplete="shipping postal-code"
			/>
			<Input
				label={"State"}
				placeholder="New Jersey"
				onInput={(v) => setForm(form => ({ ...form, state: v }))}
				type="text"
				name="state"
				autocomplete="shipping address-level1"
			/>
			<Input
				label={"Country"}
				placeholder="United States of America"
				onInput={(v) => setForm(form => ({ ...form, country: v }))}
				type="text"
				name="country"
				autocomplete="shipping country-name"
			/>
			<Button onClick={(e) => {
				e.preventDefault()
				console.log(form)
				mutate()
				navigate("/addresses")
			}} className="border-egg-yellow border-2 bg-dark-red" type="submit">Create Address</Button>

		</form>
	)
}
