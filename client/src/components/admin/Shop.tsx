import type { AddRegionAvailability, AddVariantRegionAvailability, ItemOption, ItemOptionWithVariantsPrices, NewVariantRequest, OptionVariantWithPrices, ShopItem, ShopRegion } from "@shared/validation"
import { CheckableInput, Input } from "../Input"
import { changeStateArray } from "@client/lib/arr"
import Button from "../Button"
import { Coins, CornerDownRight, Plus, Trash, X } from "lucide-react"
import { useState } from "react"

export type NewOption = Omit<ItemOption, "itemId"> & {
	variants: NewVariant[]
}

export type NewVariant = NewVariantRequest & { optionId: string, id: string }

interface ShopItemFormProps {
	item: Partial<ShopItem>
	setItem: React.Dispatch<React.SetStateAction<Partial<ShopItem>>>
}
export default function ShopItemForm({ item, setItem }: ShopItemFormProps) {
	return (
		<>

			<Input
				label="Name"
				placeholder="amazing product"
				type="text"
				name="name"
				defaultValue={item.name}
				onInput={(v) => { setItem((p) => ({ ...p, name: v })) }}
			/>
			<Input
				label="Description"
				placeholder="a nice product description"
				type="text"
				name="desc"
				defaultValue={item.description}
				onInput={(v) => { setItem((p) => ({ ...p, description: v })) }}
			/>
			<Input
				label="Image URL"
				placeholder="https://example.com/image.png"
				type="text"
				name="image"
				defaultValue={item.image ?? undefined}
				onInput={(v) => { setItem((p) => ({ ...p, image: v })) }}
			/>

		</>
	)
}

interface RegionFormProps {
	regions: ShopRegion[]
	availabilities?: AddRegionAvailability[]
	addedAvailabilities: AddRegionAvailability[]
	setAddedAvailabilities: React.Dispatch<React.SetStateAction<AddRegionAvailability[]>>
}
export function RegionForm({ regions, addedAvailabilities: selectedRegions, setAddedAvailabilities: setSelectedRegions, availabilities }: RegionFormProps) {

	const addRegion = (region: ShopRegion) => {
		setSelectedRegions((prev) => [...prev, { regionId: region.id, price: 0, quantity: null, available: true }])
	}

	const removeRegion = (regionId: string) => {
		setSelectedRegions((prev) => prev.filter(r => r.regionId !== regionId))
	}
	return (<div className="p-4 rounded-xl bg-light-brown text-beige flex flex-col gap-4">
		<select
			onChange={(ev) => {
				if (ev.currentTarget.value === "") return
				const region = regions.find(r => r.id === ev.currentTarget.value)
				if (!region) return
				addRegion({ id: region.id, name: region.name })
			}}
			className="border-4 text-egg-yellow rounded-md p-1"
		>
			<option value="">Select region</option>
			{regions.filter(r => !selectedRegions.some(sR => sR.regionId === r.id) && !availabilities?.some(a => a.regionId === r.id)).map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
		</select>
		{availabilities?.map(a => (
			<div key={a.regionId} className="border-2 rounded-md p-2">
				<div className="flex items-center justify-between text-egg-yellow">
					<h3 className="font-bold">{regions.find(r => r.id === a.regionId)!.name}</h3>
				</div>
				<div className="">
					<h4>Price: {a.price}</h4>
					<h4>Quantity: {a.quantity ? a.quantity : "Unlimited"}</h4>
				</div>
			</div >
		))}
		{selectedRegions.map(sR => (
			<div key={sR.regionId} className="border-2 rounded-md p-2">
				<div className="flex items-center justify-between text-egg-yellow">
					<h3 className="font-bold">{regions.find(r => r.id === sR.regionId)!.name}</h3>
					<Button className="w-fit" onClick={() => removeRegion(sR.regionId)}><X className="size-8" /></Button>
				</div>
				<div className="">
					<Input
						type="number"
						name="price"
						label="Price"
						placeholder="9999"
						className="w-fit"
						onInput={(value) => changeStateArray(setSelectedRegions, "regionId", sR.regionId, "price", Number(value))}
					/>
					<CheckableInput
						name="quantity"
						type="number"
						checkboxLabel={"Limit quantity?"}
						label="Quantity"
						placeholder="9999"
						fallbackValue={null}
						onInput={(value) => changeStateArray(setSelectedRegions, "regionId", sR.regionId, "quantity", value !== null ? Number(value) : null)}
					/>
				</div>
			</div >
		))
		}
	</div >)
}

interface OptionBoxProps {
	option: NewOption
	delete: (id: string) => void
	update: (updated: NewOption) => void
	addedAvailabilities: AddRegionAvailability[]
	regions: ShopRegion[]
}
function OptionBox({ option, addedAvailabilities, ...props }: OptionBoxProps) {
	const updateVariant = (updated: NewOption["variants"][number]) => {
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
		<div className="flex flex-col gap-2">
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
				<Variant
					key={v.id}
					variant={v}
					update={updateVariant}
					delete={deleteVariant}
					addedAvailabilities={addedAvailabilities}
					regions={props.regions}
				/>
			))}
			<div className="flex flex-row gap-2 items-center">
				<CornerDownRight />
				<button
					className="border-egg-yellow bg-dark-red border-2 px-2 py-2 rounded-md flex flex-row items-center text-2xl"
					onClick={() =>
						props.update({
							...option,
							variants: [
								...option.variants,
								{ id: crypto.randomUUID(), name: "", prices: Object.fromEntries(addedAvailabilities.map(a => [a.regionId, 0])), optionId: option.id }
							]
						})
					}
				>
					<Plus /> Variant

				</button>
			</div>
		</div >

	)

}

interface VariantProps {
	variant: NewOption["variants"][number]
	update: (updated: NewOption["variants"][number]) => void
	delete: (id: string) => void
	addedAvailabilities: AddRegionAvailability[]
	regions: ShopRegion[]
}


export function Variant({ variant, addedAvailabilities: addedAvailabilities, ...props }: VariantProps) {
	const [addCost, setAddCost] = useState(false)

	return (
		<div className="flex flex-col gap-2">
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
				<div className={"bg-dark-red border-egg-yellow border-2 flex flex-row items-center gap-2 rounded-md p-2"}>
					<Coins className={"size-8"} onClick={() => {
						if (!addCost) {
							props.update({ ...variant, prices: Object.fromEntries(addedAvailabilities.map(a => [a.regionId, 0])) })
						}
						setAddCost(!addCost)
					}} />
				</div>
				<button className="bg-dark-red border-2 border-egg-yellow rounded-md p-2"
					onClick={() => props.delete(variant.id)}
				><Trash className="size-8" /></button>
			</div>
			{addCost &&
				addedAvailabilities.map(a => (<div className="flex items-center gap-2 text-2xl">
					<CornerDownRight className="invisible" />
					<CornerDownRight className="visible" />
					<div className="flex gap-2 items-center border-egg-yellow border-2 rounded-md bg-dark-red p-2">
						<label>{props.regions.find(r => r.id === a.regionId)!.name}</label>
						<input
							className="border-none text-2xl w-20 p-2 "
							type="number"
							defaultValue={0}
							onInput={(ev) => {
								props.update({
									...variant, prices: { ...variant.prices, [a.regionId]: Number(ev.currentTarget.value) }
								})
							}}
						/>
					</div>
				</div>))

			}
		</div>
	)

}

interface OptionDisplayBoxProps {
	option: ItemOptionWithVariantsPrices
	variants: NewVariant[]
	updateVariants: (v: NewVariant[]) => void
	addedAvailabilities: AddRegionAvailability[]
	regions: ShopRegion[]
	newVariantAvailabilities: NewVariantRegion[]
	setNewVariantAvailabilities: React.Dispatch<React.SetStateAction<NewVariantRegion[]>>
}
function OptionDisplayBox({ option, variants, updateVariants, ...props }: OptionDisplayBoxProps) {
	const updateSingle = (updated: Omit<NewVariant, "optionId">) => {
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
				<VariantDisplay
					key={v.id}
					variant={v}
					regions={props.regions}
					addedAvailabilities={props.addedAvailabilities}
					newVariantAvailabilities={props.newVariantAvailabilities.filter(a => a.variantId === v.id)}
					setNewVariantAvailabilities={props.setNewVariantAvailabilities}
				/>
			))}
			{variants.filter((v) => v.optionId === option.id).map((v) => (
				<Variant key={v.id} variant={v} update={updateSingle} delete={del} regions={props.regions} addedAvailabilities={props.addedAvailabilities} />
			))}

			<div className="flex flex-row gap-2 items-center">
				<CornerDownRight />
				<button
					className="border-egg-yellow bg-dark-red border-2 px-2 py-2 rounded-md flex flex-row items-center text-2xl"
					onClick={() => updateVariants([...variants, { id: crypto.randomUUID(), optionId: option.id, name: "", prices: Object.fromEntries(props.addedAvailabilities.map(r => [r.regionId, 0])) }])}
				>
					<Plus /> Variant

				</button>
			</div>
		</div>
	)
}

interface VariantDisplayProps {
	variant: OptionVariantWithPrices
	regions: ShopRegion[]
	addedAvailabilities: AddRegionAvailability[]
	newVariantAvailabilities: NewVariantRegion[]
	setNewVariantAvailabilities: React.Dispatch<React.SetStateAction<NewVariantRegion[]>>
}
function VariantDisplay({ variant, regions, ...props }: VariantDisplayProps) {

	const updateVariantAvailabilites = (v: NewVariantRegion) => {
		const old = props.newVariantAvailabilities.find(old => v.variantId === old.variantId)
		if (!old) {
			props.setNewVariantAvailabilities((prev) => [...prev, v])
		} else {
			props.setNewVariantAvailabilities((prev) => prev.map(av =>
				av.variantId === v.variantId
					? v
					: av
			))
		}

	}
	return (
		<div className="flex flex-col gap-2 items-start">
			<div className="flex gap-2 items-center">
				<CornerDownRight />
				<span
					className="bg-dark-red border-egg-yellow border-2 text-2xl rounded-md p-2"
				>{variant.name}</span>
			</div>
			{
				variant.prices && Object.entries(variant.prices).map(([regionId, price]) => (<div className="flex items-center gap-2">

					<CornerDownRight className="invisible" />
					<CornerDownRight />
					<div className="flex gap-2 items-center border-egg-yellow border-2 rounded-md bg-dark-red p-2 text-2xl">
						<label>{regions.find(r => r.id === regionId)!.name}</label>
						<span>{price}</span>
					</div>
				</div>))
			}

			{props.addedAvailabilities.filter(a => !Object.keys(variant.prices).includes(a.regionId)).map(a => (<div className="flex items-center gap-2 text-2xl">
				<CornerDownRight className="invisible" />
				<CornerDownRight className="visible" />
				<div className="flex gap-2 items-center border-egg-yellow border-2 rounded-md bg-dark-red p-2">
					<label>{regions.find(r => r.id === a.regionId)!.name}</label>
					<input
						className="border-none text-2xl w-20 p-2 "
						type="number"
						defaultValue={0}
						onInput={(ev) => {
							updateVariantAvailabilites({
								variantId: variant.id, regionId: a.regionId, price: Number(ev.currentTarget.value)
							})
						}}
					/>
				</div>
			</div>))

			}
		</div >
	)
}

interface BaseOptionsFormProps {
	newOpts: NewOption[]
	setNewOpts: React.Dispatch<React.SetStateAction<NewOption[]>>
	addedAvailabilities: AddRegionAvailability[]
	regions: ShopRegion[]
}

type NewVariantRegion = AddVariantRegionAvailability & { variantId: string }
type OptionsFormProps = BaseOptionsFormProps | BaseOptionsFormProps & {
	opts: ItemOptionWithVariantsPrices[]
	newVariants: NewVariant[]
	newVariantAvailabilities: NewVariantRegion[]
	setNewVariantAvailabilities: React.Dispatch<React.SetStateAction<NewVariantRegion[]>>
	setNewVariants: React.Dispatch<React.SetStateAction<NewVariant[]>>
}

export function OptionsForm({ newOpts, setNewOpts, addedAvailabilities, ...props }: OptionsFormProps) {

	const addOption = () => setNewOpts((prev) => [...prev, { name: "", variants: [], id: crypto.randomUUID() }])
	const del = (id: string) => setNewOpts((prev) => [...prev].filter((v) => v.id !== id))
	const updateOption = (updated: NewOption) => {
		const opt = newOpts.find((o) => o.id === updated.id)
		if (!opt) {
			setNewOpts((prev) => [...prev, updated])
		} else {
			setNewOpts((prev) => prev.map((o) => o.id === updated.id ? updated : o))
		}

	}

	return (
		<div className="p-4 bg-light-brown rounded-4xl text-egg-yellow flex flex-col gap-2">
			<h2 className="text-3xl">Options</h2>
			<div>
				{"opts" in props && props.opts.map((o) => (
					<OptionDisplayBox
						option={o}
						key={o.id}
						variants={props.newVariants}
						updateVariants={props.setNewVariants}
						addedAvailabilities={addedAvailabilities}
						regions={props.regions}
						newVariantAvailabilities={props.newVariantAvailabilities}
						setNewVariantAvailabilities={props.setNewVariantAvailabilities}
					/>
				))}
				{newOpts.map((o) => (
					<OptionBox
						option={o}
						key={o.id}
						delete={del}
						update={updateOption}
						addedAvailabilities={addedAvailabilities}
						regions={props.regions}
					/>
				))}
			</div>
			<Button className="bg-dark-brown text-beige w-fit" onClick={addOption} type=""><Plus /></Button>
		</div>


	)
}
