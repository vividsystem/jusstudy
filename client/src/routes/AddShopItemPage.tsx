import Button from "@client/components/Button"
import { CheckableInput, Input } from "@client/components/Input"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { NewShopItemRequest } from "@shared/validation/shop"
import { useMutation } from "@tanstack/react-query"
import { Coins, CornerDownRight, Plus, Trash } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import z from "zod"

export default function AddShopItemPage() {

	const { pushError } = useErrors()
	const navigate = useNavigate()
	const [opts, setOpts] = useState<Option[]>([])
	const [newItem, setNewItem] = useState<Partial<z.infer<typeof NewShopItemRequest>>>({})
	const { mutate } = useMutation({
		mutationFn: async () => {

			const parsed = NewShopItemRequest.safeParse({ ...newItem, options: opts })
			if (!parsed.success) {
				const e = z.prettifyError(parsed.error)
				pushError(e.toString())

				throw e
			}

			const res = await client.api.shop.items.$post({ json: parsed.data })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			navigate("/admin/shop")
		}
	})
	return (
		<main className="w-full text-4xl flex flex-col items-center gap-4 p-4 relative">

			<Input
				label="Name"
				placeholder="amazing product"
				type="text"
				name="name"
				defaultValue={newItem.name}
				onInput={(v) => { setNewItem((p) => ({ ...p, name: v })) }}
			/>
			<Input
				label="Description"
				placeholder="a nice product description"
				type="text"
				name="desc"
				defaultValue={newItem.description}
				onInput={(v) => { setNewItem((p) => ({ ...p, description: v })) }}
			/>
			<Input
				label="Price"
				placeholder="9999"
				type="number"
				name="price"
				defaultValue={newItem.basePrice}
				onInput={(v) => { setNewItem((p) => ({ ...p, basePrice: Number(v) })) }}
			/>
			<Input
				label="Image URL"
				placeholder="https://example.com/image.png"
				type="text"
				name="image"
				defaultValue={newItem.image ?? undefined}
				onInput={(v) => { setNewItem((p) => ({ ...p, image: v })) }}
			/>
			<CheckableInput
				checkboxLabel={"Limit quantity?"}
				label="Quantity"
				placeholder="200"
				type="number"
				name="quantity"
				defaultValue={newItem.quantity ?? undefined}
				onInput={(v) => { setNewItem((p) => ({ ...p, quantity: v ? Number(v) : undefined })) }}
			/>


			<OptionsForm opts={opts} setOpts={setOpts} />

			<Button onClick={() => mutate()}>Save</Button>

		</main >

	)
}

function OptionBox({ option, ...props }: { option: Option, delete: (id: string) => void, update: (updated: Option) => void }) {
	const updateVariant = (updated: Option["variants"][number]) => {
		const variant = option.variants.find((v) => v.id == updated.id)
		if (!variant) {
			props.update({ ...option, variants: [...option.variants, updated] })
		} else {
			const newVariants = option.variants.map((o) => o.id == updated.id ? updated : o)
			props.update({ ...option, variants: newVariants })

		}
	}
	const deleteVariant = (id: string) => props.update({ ...option, variants: option.variants.filter((v) => v.id !== id) })
	return (
		<div className="flex flex-col gap-2 h-1/2">
			<div className="flex flex-row gap-2">
				<input className="bg-dark-brown border-egg-yellow border-2 text-2xl rounded-md p-2"
					name={`opt-${option.id}`}
					type="text"
					placeholder="Color"
					onInput={(ev) => props.update({ ...option, name: ev.currentTarget.value })}
				/>
				<Button className="rounded-md border-egg-yellow border-2 bg-dark-brown h-12" onClick={() => props.delete(option.id)}><Trash className="h-fit" /></Button>
			</div>
			{option.variants.map((v) => (
				<Variant key={v.id} variant={v} update={updateVariant} delete={deleteVariant} />
			))}
			<div className="flex flex-row gap-2 items-center">
				<CornerDownRight />
				<button
					className="border-egg-yellow bg-dark-red border-2 px-2 py-2 rounded-md flex flex-row items-center text-2xl"
					onClick={() => props.update({ ...option, variants: [...option.variants, { id: crypto.randomUUID(), name: "", additionalPrice: 0 }] })}
				>
					<Plus /> Variant

				</button>
			</div>
		</div>

	)

}

interface VariantProps {
	variant: Option["variants"][number]
	update: (updated: Option["variants"][number]) => void
	delete: (id: string) => void
}


export function Variant({ variant, ...props }: VariantProps) {
	const [addCost, setAddCost] = useState(false)

	return (
		<div className="flex flex-row gap-2 items-center">
			<CornerDownRight />
			<input
				className="bg-dark-red border-egg-yellow border-2 text-2xl rounded-md p-2"
				name="opt-1-var-1"
				type="text"
				placeholder="sparkly black"
				value={variant.name}
				onInput={(ev) => props.update({ ...variant, name: ev.currentTarget.value })}
			/>
			<div className={`bg-dark-red border-egg-yellow border-2 flex flex-row items-center gap-2 rounded-md ${addCost ? "" : "p-2"}`}>
				<Coins className={`size-8 ${addCost ? "pl-2" : ""}`} onClick={() => {
					if (!addCost) {
						props.update({ ...variant, additionalPrice: 0 })
					}
					setAddCost(!addCost)
				}} />
				{addCost && (
					<input
						className="border-none text-2xl w-20 p-2 "
						type="number"
						defaultValue={0}
						onInput={(ev) => {
							props.update({
								...variant, additionalPrice: Number(ev.currentTarget.value)
							})
						}}
					/>
				)}
			</div>
			<button className="bg-dark-red border-2 border-egg-yellow rounded-md p-2"
				onClick={() => props.delete(variant.id)}
			><Trash className="size-8" /></button>
		</div>
	)

}


type Option = { id: string, name: string; variants: { id: string, name: string; additionalPrice: number }[] }
interface OptionsFormProps {
	opts: Option[]
	setOpts: React.Dispatch<React.SetStateAction<Option[]>>
}
function OptionsForm({ opts, setOpts }: OptionsFormProps) {

	const addOption = () => setOpts((prev) => [...prev, { name: "", variants: [], id: crypto.randomUUID() }])
	const del = (id: string) => setOpts((prev) => [...prev].filter((v) => v.id != id))
	const updateOption = (updated: Option) => {
		const opt = opts.find((o) => o.id === updated.id)
		if (!opt) {
			setOpts((prev) => [...prev, updated])
		} else {
			setOpts((prev) => prev.map((o) => o.id === updated.id ? updated : o))
		}

	}

	return (
		<div className="p-4 bg-light-brown rounded-4xl text-egg-yellow flex flex-col gap-2">
			<h2 className="text-3xl">Options</h2>
			{opts.map((o) => (
				<OptionBox option={o} key={o.id} delete={del} update={updateOption} />
			))}
			<Button className="bg-dark-brown text-beige w-fit" onClick={addOption} type=""><Plus /></Button>
		</div>


	)
}
