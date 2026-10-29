import { useImperativeHandle, useRef, type Ref } from "react"
import { X } from "lucide-react"

interface DialogProps {
	children: React.ReactNode
	blurBg?: boolean
	ref: Ref<DialogHandle>
	onOpen?: () => void
	onClose?: () => void
}

export interface DialogHandle {
	open: () => void
	close: () => void
}

export default function Dialog({ ref, blurBg, children, onOpen, onClose }: DialogProps) {
	const dialogRef: Ref<HTMLDialogElement> = useRef(null);
	const open = () => {
		if (onOpen) {
			onOpen()
		}
		dialogRef.current?.showModal();
	}
	const close = () => {
		dialogRef.current?.close();
	}
	useImperativeHandle(ref, () => {
		return {
			open, close
		}
	})

	return <div className="group">
		<dialog
			className={`border border-dark-red bg-egg-yellow text-dark-red p-4 rounded-md self-center justify-self-center flex flex-col gap-2 z-8001 not-open:hidden ${blurBg ? "backdrop:backdrop-blur-md" : ""}`}
			ref={dialogRef}
			closedby="any"
			onClose={onClose}
		>
			<div onClick={() => close()} className="ml-auto">
				<X className="ml-auto" />
			</div>
			{children}
		</dialog >
	</div>
}
