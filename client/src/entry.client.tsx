import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import "@fontsource/aladin/400.css"
import "@fontsource/averia-serif-libre/400.css"
import "@fontsource/averia-serif-libre/400-italic.css"
import "./index.css";

ReactDOM.hydrateRoot(
	document,
	<React.StrictMode>
		<HydratedRouter />
	</React.StrictMode>,
);
