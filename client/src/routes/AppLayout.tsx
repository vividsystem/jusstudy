import BugDialog from "@client/components/BugDialog";
import UserIcon from "@client/components/UserIcon";
import { BookOpen, Bug, Compass, Eye, Folder, House, Shield, ShoppingBasket, Trophy, Vote } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import type { Route } from "./+types/AppLayout";
import { authMiddleware } from "@client/lib/middleware";
import { userContext } from "@client/lib/context";

export function Link(props: { children: ReactNode, route: string, className: string }) {
	return (
		<li className={props.className}>
			<NavLink
				to={props.route}
				prefetch={props.route != "/guides" ? "intent" : "none"}
				reloadDocument={props.route == "/guides"}
				className={({ isActive }) => `text-3xl lg:text-4xl 2xl:text-6xl rounded-md px-2 py-1 flex flex-row items-center gap-2 ${isActive ? "text-dark-red" : ""}`}
			>
				{props.children}
			</NavLink>
		</li >

	)
}

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [authMiddleware]

export async function clientLoader({ context }: Route.ClientLoaderArgs) {
	return { user: context.get(userContext)! }
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
	const [showBugDialog, setShowBugDialog] = useState(false)
	return (
		<div className="flex flex-row">
			<header className="w-1/5 2xl:w-1/6 flex flex-col justify-between h-screen p-4">
				<ul className="list-none flex flex-col items-start gap-2 2xl:gap-8">
					<Link className="rotate-5" route="/home"><House /> Home</Link>
					<Link className="-rotate-5" route="/projects"><Folder />Projects</Link>

					<Link className="rotate-4" route="/explore"><Compass />Explore</Link>

					<Link className="rotate-3" route="/vote"><Vote />Vote</Link>
					<Link className="rotate-4" route="/guides"><BookOpen />Guides</Link>
					<Link className="-rotate-5" route="/shop"><ShoppingBasket />Shop</Link>
					<Link className="" route="/rankings"><Trophy /> Rankings</Link>
					{loaderData.user.type != "participant" && (
						<Link className="" route="/reviews"><Eye /> Reviews</Link>
					)}
					{loaderData.user.type == "admin" && (
						<Link className="" route="/admin"><Shield /> Admin</Link>
					)}
				</ul>
				<div className="flex flex-row justify-start">
					<UserIcon />
					<BugDialog show={showBugDialog} setShow={setShowBugDialog} />

					<Bug className="size-8 animate-pulse absolute right-4 bottom-4" onClick={() => setShowBugDialog(true)} />
				</div>
			</header>
			<Outlet />
		</div >
	)
}
