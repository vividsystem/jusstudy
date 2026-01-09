import { authClient } from "../lib/auth-client";

function Home() {
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
