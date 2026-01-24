import { BrowserRouter, Routes, Route } from "react-router";
import Landing from "./routes/Landing";
import AppLayout from "./routes/AppLayout";
import Projects from "./routes/Projects";
import Onboarding from "./routes/Onboarding";
import Home from "./routes/Home";
import PrivateRoute from "./routes/PrivateRoute";
import NewProjectPage from "./routes/NewProject";
import ProjectDetails from "./routes/ProjectDetails";
import EditProjectDetails from "./routes/EditProjectDetails";
import NewDevlog from "./routes/NewDevlog";

function App() {
	return (
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
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
