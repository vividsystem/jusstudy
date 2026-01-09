import { Navigate, Outlet, useLocation } from "react-router";
import { authClient } from "../lib/auth-client";

export const PrivateRoute: React.FC = () => {
	const {
		data: session,
		isPending,
	} = authClient.useSession();
	const location = useLocation();

	if (isPending) {
		return <div>Loading authentication status…</div>;
	}

	return session ? (
		<Outlet />
	) : (
		<Navigate
			to="/"
			replace
			state={{ from: location }}
		/>
	);
};
