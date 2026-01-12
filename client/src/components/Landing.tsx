import { authClient } from "../lib/auth-client";
import { clientURL } from "../lib/urls";
import HackclubLogo from "./HackclubLogo";

function Landing() {
	return (
		<div className="min-h-screen min-w-screen flex flex-col">
			<HackclubLogo />
			<div className="h-screen relative inset-0 flex justify-center items-start font-serif">
				<div className="absolute top-1/6 flex flex-col justify-center items-start w-4/6 2xl:gap-8">
					<h1 className="2xl:text-10xl/tight font-serif font-bold max-h-fit">Jus'study</h1>
					<p className="2xl:text-7xl font-serif">A Hack Club <span className="font-bold">You Ship, We Ship</span> were students build projects that help with studying, focus, learning, or school life, and earn prizes for shipping real work.</p>
					<ul className="2xl:text-6xl list-disc list-inside font-serif my-10">
						<li>Build apps, tools, hardware, or experiments related to something you're studying</li>
						<li>Upload your project with a short write-up</li>
						<li>Earn prizes based on effort, creativity, and usefulness</li>
					</ul>
					<div className="2xl:text-5xl flex flex-row 2xl:gap-12 items-center justify-center">
						<button className="bg-black text-white 2xl:px-20 2xl:py-8 rounded-lg shadow-gray-700 shadow-lg">RSVP / Join YSWS</button>
						<button className="bg-white text-black 2xl:px-20 2xl:py-8 rounded-lg border-3 border-black shadow-gray-700 shadow-lg">See beginner guides</button>

					</div>
				</div>
			</div>


			AWESOME LANDING PAGE HERE
			< button onClick={async (ev) => {
				ev.preventDefault()
				await authClient.signIn.oauth2({
					providerId: "hackclub-auth",
					newUserCallbackURL: clientURL("/onboarding").toString(),
					callbackURL: clientURL("/home").toString()
				})
			}
			}> Login</button >

		</div >
	);
}

export default Landing;
