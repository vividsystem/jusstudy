import { Link as RouterLink } from "react-router";
import { MoveUpRight } from "lucide-react";


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
// w/o referrer i.e. w/o the option to click on return on the browser and go back
export default function Link(props: LinkProps) {
	const styling = `underline flex  items-center ${props.className}`
	return props.href.startsWith("/") && !props.href.startsWith("/guides") && !props.href.startsWith("/api") ?
		<RouterLink to={props.href} prefetch="intent" className={styling}>
			{props.children}
		</RouterLink> : <a
			href={props.href}
			target={props.external ? "_blank" : "_self"}
			rel={props.external ? "norefferer" : undefined} // see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel
			className={styling}

		>
			{props.children}
			<MoveUpRight />
		</a>

}
