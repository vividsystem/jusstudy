import { useState, type HTMLInputAutoCompleteAttribute, type JSX } from "react"


interface BaseInputProps {
	type: string
	label: JSX.Element | string
	name: string
	className?: string
	placeholder: string
	id?: string

	onInput: (v: string) => void
}

type InputProps = {
	type: "number"
	label: JSX.Element | string
	defaultValue?: number
	value?: number
	className?: string
	min?: string
	step?: string
} & BaseInputProps | {
	value?: string
	type: string
	autocomplete?: HTMLInputAutoCompleteAttribute
	label: JSX.Element | string
	defaultValue?: string
} & BaseInputProps


export const Input = (props: InputProps) => {
	return (
		<div className="flex flex-col">
			<label htmlFor={props.name}>{props.label}</label>
			<input type={props.type} placeholder={props.placeholder} onInput={(ev) => props.onInput(ev.currentTarget.value)} className={`border-2 rounded-lg p-2 ${props.className}`} defaultValue={props.defaultValue} min={"min" in props ? props.min : undefined} step={"step" in props ? props.min : undefined} autoComplete={"autocomplete" in props ? props.autocomplete : undefined} id={props.id} value={props.value} />
		</div>
	)
}

type CheckboxProps = {
	checked?: boolean
	onCheck: (v: boolean) => void
	label: JSX.Element | string
	name: string
	className?: string
	id?: string
}
export const Checkbox = (props: CheckboxProps) => {
	return (
		<div className="flex flex-row gap-2">
			<label htmlFor={props.name}>{props.label}</label>
			<input type="checkbox" onChange={(ev) => props.onCheck(ev.currentTarget.checked)} className={`border-2 rounded-lg p-2 ${props.className}`} id={props.id} />
		</div>
	)
}


type CheckableInputProps = {
	checkboxLabel: JSX.Element | string
	defaultChecked?: boolean
	onInput: (v?: string) => void

} & InputProps
export const CheckableInput = (props: CheckableInputProps) => {
	const { checkboxLabel, defaultChecked, onInput, ...rest } = props
	const [checked, setChecked] = useState(defaultChecked)


	const inp = (v: string) => {
		if (checked) {
			onInput(v)
		}
	}

	const onCheck = (v: boolean) => {
		if (!v) {
			onInput(undefined)
		}
		setChecked(v)

	}

	return (
		<div>
			<Checkbox label={checkboxLabel} checked={checked} onCheck={onCheck} name="checkb" />
			{checked && (
				<Input {...rest} onInput={inp} />
			)}
		</div>
	)
}
