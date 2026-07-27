import { useState } from "react"
import { Input, Checkbox } from "./Input"
import Button from "./Button"

interface SmartFormProps<T extends Record<string, any>> {
	defaultValue: T
	fields?: {
		key: keyof T
		label: string
	}[]
	exclude?: (keyof T)[]
	onSave: (v: T) => void
}

export default function SmartForm<T extends Record<string, any>>(props: SmartFormProps<T>) {
	const [value, setValue] = useState<T>(props.defaultValue)

	const keys = Object.keys(props.defaultValue) as (keyof T)[]

	const orderedFields = props.fields
		? [
			...props.fields,
			...keys
				.filter(
					(k) =>
						!props.fields!.some((f) => f.key === k) &&
						!props.exclude?.includes(k)
				)
				.map((k) => ({
					key: k,
					label: String(k),
				})),
		]
		: keys
			.filter((k) => !props.exclude?.includes(k))
			.map((k) => ({
				key: k,
				label: String(k),
			}))

	const updateValue = (key: keyof T, newValue: unknown) => {
		setValue((prev) => ({
			...prev,
			[key]: newValue,
		}))
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				props.onSave(value)
			}}
			className="flex flex-col gap-4"
		>
			{orderedFields.map(({ key, label }) => {
				const current = value[key]

				if (typeof current === "boolean") {
					return (
						<Checkbox
							key={String(key)}
							name={String(key)}
							label={label}
							checked={current}
							onCheck={(checked) => updateValue(key, checked)}
						/>
					)
				} else if (typeof current === "number") {
					return (
						<Input
							key={String(key)}
							type="number"
							name={String(key)}
							label={label}
							placeholder=""
							value={current}
							onInput={(v) => updateValue(key, Number(v))}
						/>
					)
				} else {

					return (
						<Input
							key={String(key)}
							type="text"
							name={String(key)}
							label={label}
							placeholder=""
							value={String(current ?? "")}
							onInput={(v) => updateValue(key, v)}
						/>
					)
				}

			})}
			<Button
				type="submit"
				className="text-dark-red bg-egg-yellow border-dark-red border-4"
			>
				Save
			</Button>
		</form>
	)
}
