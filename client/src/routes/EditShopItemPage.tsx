import Button from "@client/components/Button"
import { CheckableInput, Input } from "@client/components/Input"
import { client } from "@client/lib/api-client"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono"
import { Coins, CornerDownRight, Plus, Trash } from "lucide-react"
import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router"
import { Variant } from "./AddShopItemPage"

type Item = Extract<InferResponseType<typeof client.api.shop.items[":itemId"]["$get"]>, { item: unknown }>["item"]
type OldOpts = Item["options"]
type Variants = OldOpts[number]["variants"]

export default function EditShopItemPage() {
	const { id } = useParams()
	const { pushError } = useErrors()
	const navigate = useNavigate()


	const { isPending, /*error,*/ data: shopItem } = useQuery({
		queryKey: ["shopItems", id],
		queryFn: async () => {
			if (!id) {
				pushError("ItemId undefined")
				throw new Error("ItemId undefined")
			}
			const res = await client.api.shop.items[":itemId"].$get({
				param: { itemId: id }
			})
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				if (res.status == 404) {
					navigate("/shop")
				}
				throw new Error(data.message)
			}

			const data = await res.json()
			return data.item
		},
	})

	if (!isPending && !shopItem || !id) {
		return <Navigate to={"/admin/shop"} />
	}


	return (
		<main>
			{
				shopItem ? <EditItemForm item={shopItem} /> :
					(<p>loading</p>)
			}
		</main >
	)
}

function EditItemForm(props: { item: Item }) {
	const { pushError } = useErrors()
	const navigate = useNavigate()

	const [edited, setEdited] = useState<Partial<typeof props.item>>(props.item)
	const [newOptions, setNewOptions] = useState<Option[]>([])
	const [newVariants, setNewVariants] = useState<Variants>([])


	const { mutate } = useMutation({
		mutationFn: async () => {
			const res = await client.api.shop.items[":itemId"].$patch({ json: edited, param: { itemId: props.item.id } })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}

			for (const opt of newOptions) {
				const optRes = await client.api.shop.items[":itemId"].options.$post({ json: opt, param: { itemId: props.item.id } })
				if (!optRes.ok) {
					const data = await optRes.json()
					pushError(data.message)
				}

			}

			for (const variant of newVariants) {
				const variantRes = await client.api.shop.options[":optionId"].variants.$post({ json: variant, param: { optionId: variant.optionId } })
				if (!variantRes.ok) {
					const data = await variantRes.json()
					pushError(data.message)
				}
			}




			navigate("/admin/shop")
		}
	})
	return (
		<div>

			<Input
				label="Name"
				placeholder="amazing product"
				type="text"
				name="name"
				defaultValue={edited.name}
				onInput={(v) => { setEdited((p) => ({ ...p, name: v })) }}
			/>
			<Input
				label="Description"
				placeholder="a nice product description"
				type="text"
				name="desc"
				defaultValue={edited.description}
				onInput={(v) => { setEdited((p) => ({ ...p, description: v })) }}
			/>
			<Input
				label="Price"
				placeholder="9999"
				type="number"
				name="price"
				defaultValue={edited.basePrice}
				onInput={(v) => { setEdited((p) => ({ ...p, price: Number(v) })) }}
			/>
			<Input
				label="Image URL"
				placeholder="https://example.com/image.png"
				type="text"
				name="image"
				defaultValue={edited.image ?? undefined}
				onInput={(v) => { setEdited((p) => ({ ...p, image: v })) }}
			/>
			<CheckableInput
				checkboxLabel={"Limit quantity?"}
				label="Quantity"
				placeholder="200"
				type="number"
				name="quantity"
				defaultValue={edited.quantity ?? undefined}
				onInput={(v) => { setEdited((p) => ({ ...p, quantity: v ? Number(v) : undefined })) }}
			/>

			<EditOptionsForm
				opts={newOptions}
				setOpts={setNewOptions}
				oldOpts={props.item.options}
				variants={newVariants}
				updateVariants={setNewVariants}
			/>

			<Button onClick={() => mutate()}>Save</Button>

		</div>

	)
}

interface OptionBoxProps {
	option: Option
	delete: (id: string) => void
	update: (updated: Option) => void

}
function OptionBox({ option, ...props }: OptionBoxProps) {
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

interface OptionDisplayBoxProps {
	option: Option
	variants: Variants
	updateVariants: (v: Variants) => void
}
function OptionDisplayBox({ option, variants, updateVariants }: OptionDisplayBoxProps) {
	const updateSingle = (updated: Omit<Variants[number], "optionId">) => {
		const variant = variants.find((v) => v.id === updated.id)
		if (!variant) {
			updateVariants([...variants, { ...updated, optionId: option.id }])
		} else {
			updateVariants(variants.map((v) => v.id === updated.id ? { ...updated, optionId: option.id } : v))
		}
	}

	const del = (id: string) => updateVariants(variants.filter((v) => v.id !== id))

	return (
		<div className="flex flex-col gap-2 h-1/2">
			<div className="flex flex-row gap-2">
				<span className="bg-dark-brown border-egg-yellow border-2 text-2xl rounded-md p-2">{option.name}</span>
			</div>
			{option.variants.map((v) => (
				<VariantDisplay key={v.id} variant={v} />
			))}
			{variants.filter((v) => v.optionId === option.id).map((v) => (
				<Variant key={v.id} variant={v} update={updateSingle} delete={del} />
			))}

			<div className="flex flex-row gap-2 items-center">
				<CornerDownRight />
				<button
					className="border-egg-yellow bg-dark-red border-2 px-2 py-2 rounded-md flex flex-row items-center text-2xl"
					onClick={() => updateVariants([...variants, { id: crypto.randomUUID(), optionId: option.id, name: "", additionalPrice: 0 }])}
				>
					<Plus /> Variant

				</button>
			</div>
		</div>
	)
}

function VariantDisplay({ variant }: { variant: Option["variants"][number] }) {
	return (
		<div className="flex flex-row gap-2 items-center">
			<CornerDownRight />
			<span
				className="bg-dark-red border-egg-yellow border-2 text-2xl rounded-md p-2"
			>{variant.name}</span>
			{variant.additionalPrice !== undefined && variant.additionalPrice !== 0 && (
				<div className={`bg-dark-red border-egg-yellow border-2 flex flex-row items-center gap-2 rounded-md p-2`}>
					<Coins className={`size-8 pl-2`} />
					<span
						className="border-none text-2xl w-20 p-2 "
					>{variant.additionalPrice}</span>
				</div>
			)}
		</div>
	)
}


type Option = { id: string, name: string; variants: { id: string, name: string; additionalPrice: number }[] }
interface OptionsFormProps {
	oldOpts?: Option[]
	opts: Option[]
	setOpts: React.Dispatch<React.SetStateAction<Option[]>>
	variants: Variants
	updateVariants: (v: Variants) => void
}
function EditOptionsForm({ oldOpts, opts, setOpts, variants, updateVariants }: OptionsFormProps) {

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
			{oldOpts && oldOpts.map((o) => (
				<OptionDisplayBox option={o} key={o.id} variants={variants} updateVariants={updateVariants} />
			))}
			{opts.map((o) => (
				<OptionBox option={o} key={o.id} delete={del} update={updateOption} />
			))}
			<Button className="bg-dark-brown text-beige w-fit" onClick={addOption} type=""><Plus /></Button>
		</div>
	)
}
