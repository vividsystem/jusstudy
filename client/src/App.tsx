import { BrowserRouter, Routes, Route } from "react-router";
import Landing from "./routes/Landing";
import AppLayout from "./routes/AppLayout";
import Projects from "./routes/Projects";
import Onboarding from "./routes/Onboarding";
import Home from "./routes/Home";
import PrivateRoute from "./routes/PrivateRoute";
import NewProjectPage from "./routes/NewProject";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Landing />} />


				<Route element={<PrivateRoute />}>
					<Route element={<AppLayout />}>

						<Route path="/home" element={<Home />} />
						<Route path="/projects" element={<Projects />} />
						<Route path="/projects/new" element={<NewProjectPage />} />

						<Route path="/onboarding" element={<Onboarding />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
