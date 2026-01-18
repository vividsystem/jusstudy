import type { JSX } from "react"

interface InputProps {
	type: string
	label: JSX.Element | string
	name: string
	placeholder: string
	value?: string
	onInput?: (v: string) => void
}
export const Input = (props: InputProps) => {
	return (
		<>
			<label htmlFor={props.name}>{props.label}</label>
			<input type={props.type} placeholder={props.placeholder} value={props.value} onInput={(ev) => props.onInput(ev.currentTarget.value)} />
		</>
	)
}
