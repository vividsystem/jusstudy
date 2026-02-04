interface BaseParentProps {
	children: React.ReactNode;
	className?: string;
	disabled?: boolean
}

type ButtonProps = {
	href: string
	rel?: string
	target?: string
} & BaseParentProps | {
	onClick?: (ev: React.MouseEvent) => void;
} & BaseParentProps;

export default function Button(props: ButtonProps) {
	const baseStyles = "px-4 py-2 lg:px-10 lg:py-4 2xl:px-12 2xl:py-6 rounded-4xl shadow-lg flex items-center justify-center whitespace-nowrap transition-transform active:scale-95 transform-gpu backface-hidden overflow-hidden";

	if ("href" in props) {
		return (
			<a href={props.href} className={`${baseStyles} ${props.disabled ? "pointer-events-none" : ""} ${props.className}`} target={props.target} rel={props.rel}>
				{props.children}
			</a>
		);
	}

	return (
		<button onClick={props.onClick} className={`${baseStyles} ${props.className}`} disabled={props.disabled}>
			{props.children}
		</button>
	);
}
