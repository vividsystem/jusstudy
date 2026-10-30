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
import { isRouteErrorResponse } from "react-router";
import aladinLatin from "@fontsource/aladin/files/aladin-latin-400-normal.woff2?url";

export const links: Route.LinksFunction = () => [
	{
		rel: "preload",
		as: "font",
		type: "font/woff2",
		href: aladinLatin,
		crossOrigin: "anonymous",
	},
];

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
				<meta property="description" content="A YSWS where students build projects that help others study!" />

				<meta property="og:title" content="Jus'STUDY" />
				<meta property="og:description" content="A YSWS where students build projects that help others study!" />
				<meta property="og:image" content="/logo.webp" />
				<meta property="og:type" content="event" />
				<meta property="og:url" content={clientURL("/").toString()} />


				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-title" content="Jus'STUDY" />
				<link rel="apple-touch-icon" href="/logo.png" />
				<link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
				{/*<link rel="preload" as="image" href="/background.webp" fetchPriority="high" />*/}

				<Meta />
				<Links />
			</head>
			<body className="bg-[url(/background.webp)] bg-blend-screen m-0 p-0 overflow-x-hidden h-fit">
				<QueryClientProvider client={queryClient}>
					<ErrorProvider>
						{children}
					</ErrorProvider>
				</QueryClientProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let title = "Something went wrong"
	let message = "An unexpected error occurred."

	if (isRouteErrorResponse(error)) {
		title = error.status === 404 ? "Page not found" : `Error ${error.status}`
		message = typeof error.data === "string" ? error.data : error.statusText
	} else if (error instanceof Error) {
		message = error.message
	}

	return (
		<main className="…">
			<h1>{title}</h1>
			<p>{message}</p>
			<a href="/home">Back to home</a>  {/* use plain <a> so that it completely resets if something is broken*/}
			{import.meta.env.DEV && error instanceof Error && <pre>{error.stack}</pre>}
		</main>
	)
}

export function HydrateFallback() { return <Loading /> }
