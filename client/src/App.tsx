import { BrowserRouter, Routes, Route } from "react-router";
import Landing from "./routes/Landing";
import AppLayout from "./routes/AppLayout";
import Onboarding from "./routes/Onboarding";
import Home from "./routes/Home";
import PrivateRoute, { AdminRoute } from "./routes/PrivateRoute";
import { ErrorProvider } from "./lib/context/ErrorProvider";
import Projects from "./routes/projects/Projects";
import ProjectDetails from "./routes/projects/ProjectDetails";
import EditProjectDetails from "./routes/projects/EditProjectDetails";
import NewDevlog from "./routes/projects/NewDevlog";
import NewProjectPage from "./routes/projects/NewProject";
import VotePage from "./routes/voting/Vote";
import Shop from "./routes/shop/Shop";
import ShopOrders from "./routes/shop/ShopOrders";
import BuyItem from "./routes/shop/BuyItem";
import NewAddress from "./routes/shop/NewAddress";
import ManageAddresses from "./routes/shop/ManageAddresses";
import ComingSoon from "./routes/ComingSoon";
import UserProfile from "./routes/UserProfile";
import ReviewPanel from "./routes/reviews/ReviewPanel";
import ProjectReview from "./routes/reviews/ProjectReview";
import RankingPage from "./routes/voting/Ranking";
import AdminPage from "./routes/admin/Admin";
import AdminStatsPage from "./routes/admin/AdminStats";
import AdminShopPage from "./routes/admin/AdminShopPage";
import AddShopItemPage from "./routes/admin/AddShopItemPage";
import EditShopItemPage from "./routes/admin/EditShopItemPage";
// import RSVP from "./routes/RSVP";

function App() {
	return (
		<ErrorProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Landing />} />


					<Route element={<PrivateRoute />}>
						<Route element={<AppLayout />}>
							<Route path="/home" element={<Home />} />
							<Route path="/projects" element={<Projects />} />
							<Route path="/projects/:projectId" element={<ProjectDetails />} />
							<Route path="/projects/:projectId/edit" element={<EditProjectDetails />} />
							<Route path="/projects/:projectId/devlogs/new" element={<NewDevlog />} />
							<Route path="/projects/new" element={<NewProjectPage />} />

							<Route path="/onboarding" element={<Onboarding />} />

							<Route path="/vote" element={<VotePage />} />

							<Route path="/shop" element={<Shop />} />
							<Route path="/shop/orders" element={<ShopOrders />} />
							<Route path="/shop/:itemId" element={<BuyItem />} />
							<Route path="/addresses/new" element={<NewAddress />} />
							<Route path="/addresses" element={<ManageAddresses />} />

							<Route path="/explore" element={<ComingSoon />} />
							<Route path="/guides" element={<ComingSoon />} />

							<Route path="/users/:id" element={<UserProfile />} />

							<Route path="/reviews" element={<ReviewPanel />} />
							<Route path="/reviews/:id" element={<ProjectReview />} />
							<Route path="/rankings" element={<RankingPage />} />
							<Route element={<AdminRoute />}>
								<Route path="/admin" element={<AdminPage />} />
								<Route path="/admin/stats" element={<AdminStatsPage />} />
								<Route path="/admin/user-history/:id" element={<AdminPage />} />
								<Route path="/admin/shop" element={<AdminShopPage />} />
								<Route path="/admin/shop/new" element={<AddShopItemPage />} />
								<Route path="/admin/shop/item/:id/edit" element={<EditShopItemPage />} />
							</Route>
						</Route>
					</Route>
				</Routes>
			</BrowserRouter>
		</ErrorProvider>
	);
}

export default App;
