import type { Route } from "./+types/root";
import { ErrorProvider } from "@client/lib/context/ErrorProvider";
import { clientURL } from "@client/lib/urls";
import { QueryClientProvider } from "@tanstack/react-query";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import { queryClient } from "./lib/query-client";
import Loading from "./components/Loading";

export function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />

				<link rel="icon" href="/favicon.ico" sizes="any" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />

				<title>Jus'STUDY</title>

				<meta property="og:title" content="Jus'STUDY" />
				<meta property="og:description" content="A YSWS where students build projects that help others study!" />
				<meta property="og:image" content="/logo.webp" />
				<meta property="og:type" content="event" />
				<meta property="og:url" content={clientURL("/").toString()} />


				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-title" content="Jus'STUDY" />
				<link rel="apple-touch-icon" href="/logo.png" />
				<link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
				<link rel="preload" as="image" href="/background.webp" fetchPriority="high" />

				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin={"anonymous"} />
				<link rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,400;1,400&family=Aladin&display=swap" />
				<Meta />
				<Links />
			</head>
			<body className="bg-[url(/background.webp)] bg-blend-screen m-0 p-0 overflow-x-hidden h-fit">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	return <QueryClientProvider client={queryClient}>
		<ErrorProvider><Outlet /></ErrorProvider>
	</QueryClientProvider>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	// build this
	return <p>{error}</p>

}

export function HydrateFallback() { return <Loading /> }
