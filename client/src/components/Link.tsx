import { MoveUpRight } from "lucide-react"


interface TextLinkProps {
	href: string
	text: string
	external?: boolean
	className?: string
}
export function TextLink(props: TextLinkProps) {
	const { text, ...linkProps } = props;
	return <Link {...linkProps}>
		{text}
	</Link>
}

interface LinkProps {
	href: string
	children: React.ReactNode
	external?: boolean
	className?: string
}
// behaviour: 
// external links get opened in new tab 
// w/o refferer i.e. w/o the option to click on return on the browser and go back
export default function Link(props: LinkProps) {
	return <a
		href={props.href}
		target={props.external ? "_blank" : "_self"}
		rel={props.external ? "norefferer" : undefined} // see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel
		className={`underline flex  items-center ${props.className}`}

	>
		{props.children}
		{props.external && (
			<MoveUpRight />
		)}

	</a>

}
