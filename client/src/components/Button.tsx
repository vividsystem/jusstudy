interface ButtonProps {
	href?: string;
	onClick?: (ev: React.MouseEvent) => void;
	children: React.ReactNode;
	variant?: "black" | "white";
	className?: string;
	target?: string;
	rel?: string;
}

export default function Button({
	href,
	onClick,
	children,
	variant = "black",
	className = "",
	target,
	rel
}: ButtonProps)

{
	const baseStyles = "px-4 py-2 lg:px-10 lg:py-4 2xl:px-12 2xl:py-6 rounded-[1.25rem] shadow-lg flex items-center justify-center whitespace-nowrap transition-transform active:scale-95";
	const variantStyles = variant === "black" 
		? "bg-[#FFE6A7] text-[#6F1D1B] border-2 border-[#6F1D1B]" 
		: "bg-[#6F1D1B] text-[#FFE6A7] border-2 border-[#FFE6A7]";
	
	const combinedClassName = `${baseStyles} ${variantStyles} ${className}`;

	if (href) {
		return (
			<a href={href} className={combinedClassName} target={target} rel={rel}>
				{children}
			</a>
		);
	}

	return (
		<button onClick={onClick} className={combinedClassName}>
			{children}
		</button>
	);
}
