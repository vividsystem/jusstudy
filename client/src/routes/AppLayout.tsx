import ErrorBoundary from "@client/components/ErrorBoundary";
import UserIcon from "@client/components/UserIcon";
import { authClient } from "@client/lib/auth-client";
import { Navigate, Outlet, useLocation } from "react-router";

export function Link(props: { name: string, route: string, className: string }) {
	const location = useLocation()
	return (
		<li className={`${props.className} ${location.pathname == props.route ? "bg-egg-yellow" : ""}`}><a href={props.route} className="text-6xl">{props.name}</a></li>
	)
}


export default function AppLayout() {
	const { data } = authClient.useSession()
	if (data == null) {
		return <Navigate to={"/"} />
	}
	return (
		<ErrorBoundary>
			<div className="flex flex-row">
				<header className="w-1/4 2xl:w-1/6 flex flex-col justify-between h-screen p-4">
					<ul className="list-none flex flex-col items-center gap-8">
						<Link className="rotate-5" route="/home" name="Home" />
						<Link className="-rotate-5" route="/projects" name="Projects" />
						<Link className="rotate-4" route="/explore" name="Explore" />
						<Link className="rotate-4" route="/guides" name="Guides" />
						<Link className="-rotate-5" route="/shop" name="Shop" />
						<Link className="" route="/rankings" name="Rankings" />
						{data.user.type != "participant" && (
							<Link className="" route="/reviews" name="Reviews" />
						)}
					</ul>
					<UserIcon />
				</header>
				<Outlet />
			</div>
		</ErrorBoundary>
	)
}
