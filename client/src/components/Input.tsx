import type { JSX } from "react"


interface BaseInputProps {
	type: string
	label: JSX.Element | string
	name: string
	className?: string
	placeholder: string

	onInput: (v: string) => void
}

type InputProps = {
	type: "number"
	label: JSX.Element | string
	defaultValue?: number
	className?: string
	min?: string
	step?: string
} & BaseInputProps | {
	type: string
	label: JSX.Element | string
	defaultValue?: string
} & BaseInputProps


export const Input = (props: InputProps) => {
	return (
		<div className="flex flex-col">
			<label htmlFor={props.name}>{props.label}</label>
			<input type={props.type} placeholder={props.placeholder} onInput={(ev) => props.onInput(ev.currentTarget.value)} className={`border-2 rounded-lg p-2 ${props.className}`} defaultValue={props.defaultValue} min={"min" in props ? props.min : undefined} step={"step" in props ? props.min : undefined} />
		</div>
	)
}
