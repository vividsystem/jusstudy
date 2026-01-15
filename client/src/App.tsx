import { BrowserRouter, Routes, Route } from "react-router";
import Landing from "./components/Landing";
import { PrivateRoute } from "./components/PrivateRoute";
import Home from "./components/Home";
import Onboarding from "./components/Onboarding";
import AppLayout from "./components/AppLayout";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Landing />} />


				<Route element={<PrivateRoute />}>
					<Route element={<AppLayout />}>

						<Route path="/home" element={<Home />} />

						<Route path="/onboarding" element={<Onboarding />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
