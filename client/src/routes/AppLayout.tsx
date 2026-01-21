import { Outlet } from "react-router";

export default function AppLayout() {
	return (
		<div className="flex flex-row p-4">
			<header className="w-1/10">
				<ul className="list-none">
					<li><a href="/projects" className="underline underline-offset-2 text-6xl"> Projects</a></li>
				</ul>
			</header>
			<Outlet />
		</div>
	)
}
