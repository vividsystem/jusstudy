import { authClient } from "../lib/auth-client";
import { clientURL } from "../lib/urls";
import HackclubLogo from "./HackclubLogo";

function Landing() {
	return (
		<div className="relative inset-0 min-h-screen min-w-screen flex flex-col items-center justify-start">
			<HackclubLogo />
			<div className="relative mt-20 2xl:mt-0 min-h-screen flex flex-col justify-start w-4/6 2xl:gap-8 gap-4">
				<h1 className="2xl:text-10xl/tight lg:text-9xl text-6xl font-bold max-h-fit title-font">Jus'study</h1>
				<p className="2xl:text-7xl lg:text-4xl text-lg">A Hack Club <span>You Ship, We Ship</span> where students build projects that help with studying, focus, learning, or school life, and earn prizes for shipping real work.</p>
				<ul className="2xl:text-6xl lg:text-2xl text-md list-disc list-inside my-2 lg:my-10">
					<li>Build apps, tools, hardware, or experiments related to something you're studying</li>
					<li>Upload your project with a short write-up</li>
					<li>Earn prizes based on effort, creativity, and usefulness</li>
				</ul>
				<div className="2xl:text-5xl lg:text-3xl text-xl flex lg:flex-row flex-col gap-6 2xl:gap-12 lg:gap-8 items-center justify-start">
					<a
						href="https://forms.fillout.com/t/aX86bHVxqkus"
						target="_blank"
						rel="noreferrer"
						className="bg-black text-white 2xl:px-20 2xl:py-8 lg:px-10 lg:py-4 rounded-lg shadow-gray-700 shadow-lg flex items-center justify-center px-5 py-2"
					>
						RSVP / Join YSWS
					</a>
					<a
						href="/beginner"
						className="bg-white text-black 2xl:px-20 2xl:py-8 lg:px-10 lg:py-4 px-5 py-2 rounded-lg border lg:border-2 2xl:border-3 border-black shadow-gray-700 shadow-lg flex items-center justify-center"
					>
						See Beginner Guides
					</a>
				</div>
			</div>


			<div className="relative">
				<button onClick={async (ev) => {
					ev.preventDefault()
					await authClient.signIn.oauth2({
						providerId: "hackclub-auth",
						newUserCallbackURL: clientURL("/onboarding").toString(),
						callbackURL: clientURL("/home").toString()
					})
				}
				}> Login</button >
			</div>

		</div >
	);
}

export default Landing;
