import ErrorBoundary from "@client/components/ErrorBoundary";
import UserIcon from "@client/components/UserIcon";
import { Outlet } from "react-router";

export default function AppLayout() {
	return (
		<ErrorBoundary>
			<div className="flex flex-row">
				<header className="w-1/4 2xl:w-1/6 flex flex-col justify-between h-screen p-4">
					<ul className="list-none flex flex-col items-center gap-8">
						<li className="rotate-5"><a href="/home" className="text-6xl">Home</a></li>
						<li className="-rotate-5"><a href="/projects" className="text-6xl">Projects</a></li>
						<li className="rotate-4"><a href="/explore" className="text-6xl">Explore</a></li>
						<li className="rotate-4"><a href="/guides" className="text-6xl">Guides</a></li>
						<li className="-rotate-5"><a href="/shop" className="text-6xl">Shop</a></li>
						<li className=""><a href="/rankings" className="text-6xl">Rankings</a></li>
					</ul>
					<UserIcon />
				</header>
				<Outlet />
			</div>
		</ErrorBoundary>
	)
}
