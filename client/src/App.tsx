import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./components/Home";
import { PrivateRoute } from "./components/PrivateRoute";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />


				<Route element={<PrivateRoute />}>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
