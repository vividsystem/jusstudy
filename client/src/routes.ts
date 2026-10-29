import {
	type RouteConfig,
	route,
	index,
	layout,
	prefix,
} from "@react-router/dev/routes";

export default [
	index("routes/Landing.tsx"),

	layout("routes/AppLayout.tsx", { id: "app" }, [
		route("home", "routes/Home.tsx"),
		route("onboarding", "routes/Onboarding.tsx"),

		...prefix("projects", [
			index("routes/projects/Projects.tsx"),
			route("new", "routes/projects/NewProject.tsx"),
			route(":projectId", "routes/projects/ProjectDetails.tsx"),
			route(":projectId/edit", "routes/projects/EditProjectDetails.tsx"),
			route(":projectId/devlogs/new", "routes/projects/NewDevlog.tsx"),
		]),

		route("vote", "routes/voting/Vote.tsx"),
		route("rankings", "routes/voting/Ranking.tsx"),

		...prefix("shop", [
			index("routes/shop/Shop.tsx"),
			route("orders", "routes/shop/ShopOrders.tsx"),
			route(":itemId", "routes/shop/BuyItem.tsx"),
		]),
		...prefix("addresses", [
			index("routes/shop/ManageAddresses.tsx"),
			route("new", "routes/shop/NewAddress.tsx"),
		]),

		route("explore", "routes/Explore.tsx"),
		route("settings", "routes/Settings.tsx"),
		route("users/:id", "routes/UserProfile.tsx"),

		layout("routes/reviews/ReviewerLayout.tsx", [
			route("reviews", "routes/reviews/ReviewPanel.tsx"),
			route("reviews/:id", "routes/reviews/ProjectReview.tsx"),
		]),

		layout("routes/admin/AdminLayout.tsx", [
			...prefix("admin", [
				index("routes/admin/Admin.tsx"),
				route("stats", "routes/admin/AdminStats.tsx"),
				route("user-history/:id", "routes/admin/AdminUserHistory.tsx"),
				route("shop", "routes/admin/AdminShopPage.tsx"),
				route("shop/regions", "routes/admin/AdminShopRegions.tsx"),
				route("shop/items", "routes/admin/AdminShopItems.tsx"),
				route("shop/items/new", "routes/admin/AddShopItemPage.tsx"),
				route("shop/items/:id/edit", "routes/admin/EditShopItemPage.tsx"),
			]),
		]),
	]),

	route("*", "routes/NotFound.tsx"),
] satisfies RouteConfig
