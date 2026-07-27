import Button from "./Button"

export default function ConfirmDialog(props: {
	description: string
	show: boolean
	setShow: (v: boolean) => void
	onConfirm: () => void
}) {

	return (
		<div className={`${props.show ? "visible" : "hidden"} absolute inset-0 flex items-center justify-center`}>
			<div className="absolute inset-0 z-9998 backdrop-blur-xl" onClick={() => props.setShow(false)}></div>

			<div className={`relative z-9999 border-dark-red border-4 w-fit rounded-4xl p-8 bg-egg-yellow flex flex-col gap-4`}>
				<h2 className="text-4xl">{props.description}</h2>

				<div className="flex flex-row gap-4">
					<Button onClick={() => {
						props.onConfirm()
						props.setShow(false)
					}} className="bg-dark-red text-beige">Confirm</Button>
					<Button className="bg-beige text-dark-red" onClick={() => props.setShow(false)}>Cancel</Button>
				</div>
			</div>
		</div>
	)
}
