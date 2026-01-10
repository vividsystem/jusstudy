import { authClient } from "../lib/auth-client";
import { clientURL } from "../lib/urls";

function Landing() {
	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			<h1 className="text-5xl">Jus'study</h1>



			AWESOME LANDING PAGE HERE
			<button onClick={async (ev) => {
				ev.preventDefault()
				await authClient.signIn.oauth2({
					providerId: "hackclub-auth",
					newUserCallbackURL: clientURL("/onboarding").toString(),
					callbackURL: clientURL("/home").toString()
				})
			}}>Login</button>

		</div>
	);
}

export default Landing;
