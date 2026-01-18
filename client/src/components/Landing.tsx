import { authClient } from "../lib/auth-client";
import { clientURL } from "../lib/urls";
import HackclubLogo from "./HackclubLogo";

function Landing() {
	const login = async (ev: React.MouseEvent) => {
		ev.preventDefault()
		await authClient.signIn.oauth2({
			providerId: "hackclub-auth",
			newUserCallbackURL: clientURL("/onboarding").toString(),
			callbackURL: clientURL("/home").toString()
		})
	}

	return (
		<div className="w-full flex flex-col items-center justify-start overflow-x-hidden pb-20">
			<HackclubLogo />
			
			<main className="mt-20 2xl:mt-10 flex flex-col w-[85%] lg:w-[70%] gap-6 lg:gap-8 2xl:gap-10">
				<h1 className="text-6xl lg:text-9xl 2xl:text-9-5xl font-bold title-font">Jus'STUDY</h1>
				
				<p className="text-lg lg:text-4xl 2xl:text-5xl">
					A Hack Club <span>You Ship, We Ship</span> where students build projects that help with studying, focus, learning, or school life, and earn prizes for shipping real work.
				</p>
				
				<ul className="text-md lg:text-2xl 2xl:text-3xl list-disc list-inside space-y-2 lg:space-y-4">
					<li>Build apps, tools, hardware, or experiments related to something you're studying</li>
					<li>Upload your project with a short write-up</li>
					<li>Earn prizes based on effort, creativity, and usefulness</li>
				</ul>
				
				<div className="flex flex-row flex-wrap gap-4 lg:gap-8 2xl:gap-10 text-lg lg:text-3xl 2xl:text-4xl justify-start items-center">
					<a href="https://forms.fillout.com/t/aX86bHVxqkus" target="_blank" rel="noreferrer"
						className="bg-black text-white px-4 py-2 lg:px-10 lg:py-4 2xl:px-12 2xl:py-6 rounded-[1.25rem] shadow-lg flex items-center justify-center whitespace-nowrap">
						RSVP / Join YSWS
					</a>
					<a href="/beginner"
						className="bg-white text-black px-4 py-2 lg:px-10 lg:py-4 2xl:px-12 2xl:py-6 rounded-[1.25rem] border-2 border-black shadow-lg flex items-center justify-center whitespace-nowrap">
						See Beginner Guides
					</a>
				</div>
			</main>

			<button onClick={login} className="mt-10 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
				Login
			</button>
		</div>
	);
}

export default Landing;
