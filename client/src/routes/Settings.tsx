import Button from "@client/components/Button";
import PageHeader from "@client/components/PageHeaders";
import { authClient } from "@client/lib/auth-client";
import { queryClient } from "@client/lib/query-client";
import { clientURL } from "@client/lib/urls";
import { useUser } from "@client/lib/useUser";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router";

export default function Settings() {
	const navigate = useNavigate()
	const { data: accounts } = useQuery({
		queryKey: ["userAccounts"],
		queryFn: async () => {
			const { data: accounts } = await authClient.listAccounts()
			return accounts
		}
	})

	const connected = useMemo(() => accounts?.some((a) => a.providerId === "hackatime"), [accounts])
	const user = useUser()


	return <main className="w-full p-4 min-h-screen flex flex-col gap-2">
		<PageHeader>Settings</PageHeader>

		<div className="border-4 w-fit rounded-md bg-egg-yellow border-dark-red p-2 text-dark-red flex flex-col">
			<h2 className="text-2xl">Personal Information</h2>
			<span>{user.name}</span>

			<span>{user.email}</span>
			<span>{user.nickname}</span>

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
		<Button
			className="bg-dark-red w-fit text-egg-yellow border-4"
			onClick={async (ev) => {
				ev.preventDefault()
				await authClient.signOut()
				queryClient.clear()   // drops the session AND the previous user's cached API data
				navigate("/")
			}}
		>
			Sign-out
		</Button >
	</main >
}
