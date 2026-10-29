import Button from "@client/components/Button"
import { Input } from "@client/components/Input"
import { useUserSearch } from "@client/lib/userSearch"
import { useState } from "react"
import { Link } from "react-router";

export default function AdminPage() {
	const [query, setQuery] = useState("");
	const { data } = useUserSearch(query);

	return (
		<main className="w-full min-h-screen p-4 text-4xl flex flex-col gap-4">
			<div className="flex flex-row gap-4">
				<Button className="w-fit border-dark-red border-4 bg-egg-yellow" href="/admin/stats">go to stats..</Button>
				<Button className="w-fit border-dark-red border-4 bg-egg-yellow" href="/admin/shop">go to shop..</Button>
			</div>

			<div className="p-4 bg-egg-yellow text-light-brown border-dark-red border-4 w-fit rounded-4xl h-fit">
				<h2 className="bold text-6xl text-dark-brown">User search</h2>
				<Input type="text" placeholder="User ID/Slack ID/Email/Real Name/..." label={""} name="q" onInput={(v) => setQuery(v)} />
				<div className="flex flex-col pt-4">
					{data?.results.map((user) => (
						<Link key={user.id} className="flex flex-row items-center gap-2 border-dark-red border-2 rounded-2xl p-4" to={`/admin/user-history/${user.id}`} prefetch="intent">
							{user.image && (
								<img alt="user pfp" src={user.image} className="size-20 rounded-full" />
							)}
							<span>{user.nickname} ({user.slackId})</span>
							<span className="border border-dark-red rounded-full p-1 text-xl">{user.type}</span>

							<strong className="blur hover:blur-none">{user.name}</strong>
						</Link>
					))}
					{data && data.results.length === 0 && (
						<p>No users found for "{data.query}"</p>
					)}
				</div>
			</div>

		</main >
	)
}
