interface RewardBoxProps {
	src: string;
	label: string;
	rotationDeg: number;
}

export default function RewardBox(props: RewardBoxProps) {
	const isStylus = props.src === "/reward/apple-pencil.png";
	const boxPadding = isStylus ? "p-1 sm:p-2 lg:p-2" : "p-2 sm:p-3 lg:p-4";
	const labelPadding = isStylus ? "px-1 pb-1" : "px-2 pb-2";
	const imagePadding = isStylus ? "p-1" : "p-1 sm:p-2";

	return (
		<div
			className={`inline-flex flex-col items-center bg-[#FFF0D0] border-4 border-[#432818] rounded-2xl rotate-[var(--r)] ${boxPadding}`}
			style={{ ["--r" as never]: `${props.rotationDeg}deg` }}
		>
			<img
				src={props.src}
				alt=""
				className={`max-w-full h-auto max-h-16 sm:max-h-24 lg:max-h-40 2xl:max-h-48 object-contain ${imagePadding}`}
				onContextMenu={(e) => e.preventDefault()}
			/>
			<span className={`w-full ${labelPadding} text-[10px] sm:text-xs lg:text-lg 2xl:text-xl font-bold text-[#432818] text-center leading-tight`}>
				{props.label}
			</span>
		</div>
	);
}
