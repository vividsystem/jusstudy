import { requireRole } from "@client/lib/middleware"
import { Outlet } from "react-router"

export const clientMiddleware = [requireRole("reviewer", "fraud", "admin")]
export default function AdminLayout() { return <Outlet /> }
