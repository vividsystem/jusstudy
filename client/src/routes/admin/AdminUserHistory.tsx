import { Navigate, useParams } from "react-router"

export default function AdminUserHistoryPage() {
	const { id } = useParams()
	if (!id) {
		return <Navigate to={"/admin"} />
	}
	return <main className="w-full min-h-screen">
	</main>
}
