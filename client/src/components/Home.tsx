import { useState } from "react";
import { hcWithType } from "server/dist/client";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";


const client = hcWithType(SERVER_URL);

type ResponseType = Awaited<ReturnType<typeof client.hello.$get>>;


function Home() {
	const [data, setData] = useState<
		Awaited<ReturnType<ResponseType["json"]>> | undefined
	>();

	const { mutate: sendRequest } = useMutation({
		mutationFn: async () => {
			try {
				const res = await client.hello.$get();
				if (!res.ok) {
					console.log("Error fetching data");
					return;
				}
				const data = await res.json();
				setData(data);
			} catch (error) {
				console.log(error);
			}
		},
	});

	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			Jus'study
			<button onClick={async (ev) => {
				ev.preventDefault()
				await authClient.signIn.oauth2({
					providerId: "hackclub-auth",
					newUserCallbackURL: "/onboarding",
					callbackURL: "/home"
				})
			}}>Login</button>

		</div>
	);
}

export default Home;
