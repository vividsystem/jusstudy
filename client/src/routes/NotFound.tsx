import Link from "@client/components/Link";
import PageHeader from "@client/components/PageHeaders";

export default function Component() {
	return <main className="p-16 flex flex-col items-center w-full h-screen">
		<PageHeader>404</PageHeader>
		<p className="text-center">The page you were looking for could not be found.<br /> If you think this is a bug, reach out to <span className="text-dark-red">@vividsystem</span> on Slack or Github.</p>
		<Link href="/home">Go back home</Link>
	</ main>
}
