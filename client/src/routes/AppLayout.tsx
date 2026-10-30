import BugDialog from "@client/components/BugDialog";
import UserIcon from "@client/components/UserIcon";
import { Bug } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import type { Route } from "./+types/AppLayout";
import { authMiddleware } from "@client/lib/middleware";
import { userContext } from "@client/lib/context";

export function Link(props: { name: string, route: string, className: string }) {
	return (
		<li className={props.className}>
			<NavLink
				to={props.route}
				prefetch={props.route != "/guides" ? "intent" : "none"}
				reloadDocument={props.route == "/guides"}
				className={({ isActive }) => `text-3xl lg:text-4xl 2xl:text-6xl ${isActive ? "bg-egg-yellow" : ""}`}
			>
				{props.name}
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
			<header className="w-1/4 2xl:w-1/6 flex flex-col justify-between h-screen p-4">
				<ul className="list-none flex flex-col items-center gap-4 2xl:gap-8">
					<Link className="rotate-5" route="/home" name="Home" />
					<Link className="-rotate-5" route="/projects" name="Projects" />
					<Link className="rotate-4" route="/explore" name="Explore" />
					<Link className="rotate-4" route="/guides" name="Guides" />
					<Link className="-rotate-5" route="/shop" name="Shop" />
					<Link className="rotate-3" route="/vote" name="Voting" />
					<Link className="" route="/rankings" name="Rankings" />
					{loaderData.user.type != "participant" && (
						<Link className="" route="/reviews" name="Reviews" />
					)}
					{loaderData.user.type == "admin" && (
						<Link className="" route="/admin" name="Admin" />
					)}
				</ul>
				<div className="flex flex-row gap-8 items-center">
					<UserIcon />
					<BugDialog show={showBugDialog} setShow={setShowBugDialog} />
					<Bug className="size-8 animate-pulse" onClick={() => setShowBugDialog(true)} />
				</div>
			</header>
			<Outlet />
		</div>
	)
}
