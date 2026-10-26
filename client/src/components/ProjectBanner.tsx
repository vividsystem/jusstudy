export default function ProjectBanner(props: { url?: string | null, className?: string }) {
	return <img src={props.url ?? "/fallback_project_banner.svg"} alt={"project banner"} className={props.className ?? "aspect-2/1 w-full rounded-xl"} />
}
