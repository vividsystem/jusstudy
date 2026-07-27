import { X } from "lucide-react"

export default function BugDialog(props: {
	show: boolean
	setShow: (v: boolean) => void
}) {

	return (
		<div className={`${props.show ? "visible" : "hidden"} absolute inset-0 flex items-center justify-center`}>
			<div className="absolute inset-0 z-9998 backdrop-blur-xl" onClick={() => props.setShow(false)}></div>

			<div className={`relative z-9999 border-dark-red border-4 w-fit rounded-4xl p-8 bg-egg-yellow flex flex-col gap-4`}>
				<div className="flex flex-row justify-end">
					<X onClick={() => props.setShow(false)} className="size-8" />
				</div>
				<h2 className="text-4xl">If you notice a bug, DM @vividsystem with the details.</h2>

			</div>
		</div>
	)
}
