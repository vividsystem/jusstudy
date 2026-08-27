import Button from "@client/components/Button";
import { authClient } from "@client/lib/auth-client";
import { clientURL } from "@client/lib/urls";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Navigate } from "react-router";

export default function Settings() {
	const { data: accounts } = useQuery({
		queryKey: ["userAccounts"],
		queryFn: async () => {
			const { data: accounts } = await authClient.listAccounts()
			return accounts
		}
	})

	const { data: session } = authClient.useSession()
	if (!session) {
		return <Navigate to={"/"} />
	}

	const connected = useMemo(() => accounts?.some((a) => a.providerId === "hackatime") || false, [accounts])

	return <main className="w-full p-4 min-h-screen flex flex-col gap-2">
		<h1 className="text-4xl">Settings</h1>

		<div className="border-4 w-fit rounded-md bg-egg-yellow border-dark-red p-2 text-dark-red flex flex-col">
			<h2 className="text-2xl">Personal Information</h2>
			<span>{session.user.name}</span>

			<span>{session.user.email}</span>
			<span>{session.user.nickname}</span>

		</div>
		<div className="border-4 w-fit rounded-md bg-egg-yellow border-dark-red p-2 text-dark-red">
			<h2 className="text-2xl">Hackatime</h2>
			<div className="flex items-center">
				<span className={`p-2 rounded-md ${connected ? "text-green-400" : "text-red-400"}`}>{connected ? "Connected" : "Not connected"}</span>
				{!connected && (

					<Button className="border-2" onClick={async () => {
						await authClient.linkSocial({
							provider: "hackatime",
							callbackURL: clientURL("/settings").toString()
						})

					}}>Connect</Button>
				)}
			</div>
		</div>
	</main >
}
