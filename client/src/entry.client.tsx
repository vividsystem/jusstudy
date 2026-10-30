import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import "@fontsource/aladin/latin-400.css"
import "./index.css";

ReactDOM.hydrateRoot(
	document,
	<React.StrictMode>
		<HydratedRouter />
	</React.StrictMode>,
);
