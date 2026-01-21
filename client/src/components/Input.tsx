import type { JSX } from "react"

interface InputProps {
	type: string
	label: JSX.Element | string
	name: string
	placeholder: string
	defaultValue?: string
	onInput: (v: string) => void
	className?: string
}
export const Input = (props: InputProps) => {
	return (
		<div className="flex flex-col">
			<label htmlFor={props.name}>{props.label}</label>
			<input type={props.type} placeholder={props.placeholder} onInput={(ev) => props.onInput(ev.currentTarget.value)} className={`border-2 rounded-lg p-2 ${props.className}`} defaultValue={props.defaultValue} />
		</div>
	)
}
