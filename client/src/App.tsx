import { BrowserRouter, Routes, Route } from "react-router";
import Landing from "./routes/Landing";
import AppLayout from "./routes/AppLayout";
import Projects from "./routes/Projects";
import Onboarding from "./routes/Onboarding";
import Home from "./routes/Home";
import PrivateRoute, { AdminRoute } from "./routes/PrivateRoute";
import NewProjectPage from "./routes/NewProject";
import ProjectDetails from "./routes/ProjectDetails";
import EditProjectDetails from "./routes/EditProjectDetails";
import NewDevlog from "./routes/NewDevlog";
import Shop from "./routes/Shop";
import BuyItem from "./routes/BuyItem";
import NewAddress from "./routes/NewAddress";
import ManageAddresses from "./routes/ManageAddresses";
import ComingSoon from "./routes/ComingSoon";
import ReviewPanel from "./routes/ReviewPanel";
import ProjectReview from "./routes/ProjectReview";
import VotePage from "./routes/Vote";
import { ErrorProvider } from "./lib/context/ErrorContext";
import RankingPage from "./routes/Ranking";
import AdminPage from "./routes/Admin";
import AdminStatsPage from "./routes/AdminStats";
import AdminShopPage from "./routes/AdminShopPage";
import EditShopItemPage from "./routes/EditShopItemPage";
import AddShopItemPage from "./routes/AddShopItemPage";
import UserProfile from "./routes/UserProfile";
import ShopOrders from "./routes/ShopOrders";
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

							<Route path="/user/:id" element={<UserProfile />} />

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
