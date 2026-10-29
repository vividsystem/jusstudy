import { useRouteLoaderData } from "react-router"
import type { clientLoader } from "@client/routes/AppLayout"

export function useUser() {
	const data = useRouteLoaderData<typeof clientLoader>("app")
	if (!data) throw new Error("useUser must be used inside the app layout")
	return data.user
}
