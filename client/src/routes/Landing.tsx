import HackclubLogo from "@client/components/HackclubLogo";
import { authClient } from "../lib/auth-client";
import { clientURL } from "../lib/urls";
import Button from "@client/components/Button";

function Landing() {
	const login = async (ev: React.MouseEvent) => {
		ev.preventDefault();
		await authClient.signIn.oauth2({
			providerId: "hackclub-auth",
			newUserCallbackURL: clientURL("/onboarding").toString(),
			callbackURL: clientURL("/home").toString()
		});
	};

	return (
		<div className="relative w-full min-height-screen flex flex-col items-center justify-start overflow-x-hidden pb-20">
			{/* Background Layers */}
			<div className="absolute top-0 left-0 w-full pointer-events-none z-0">
				<img
					src="/ColorBanner_1.svg"
					alt="Banner"
					className="w-full h-auto block"
				/>
			</div>

			{/* Navigation Elements */}
			<div className="relative z-50 w-full">
				<HackclubLogo />
				<span
					onClick={login}
					className="fixed top-8 right-8 lg:top-12 lg:right-12 text-xl lg:text-3xl 2xl:text-4xl underline opacity-80 hover:opacity-100 transition-opacity cursor-pointer text-black"
				>
					Login
				</span>
			</div>

			{/* Main Content */}
			<main className="relative z-10 mt-32 lg:mt-64 2xl:mt-80 flex flex-col w-[85%] lg:w-[70%] gap-6 lg:gap-8 2xl:gap-10">
				<h1 className="text-6xl lg:text-9xl 2xl:text-9-5xl font-bold title-font">
					Jus'STUDY
				</h1>

				<p className="text-lg lg:text-4xl 2xl:text-5xl">
					A Hack Club <span>You Ship, We Ship</span> where students build projects that help with studying, focus, learning, or school life, and earn prizes for shipping real work.
				</p>

				<ul className="text-md lg:text-2xl 2xl:text-3xl list-disc list-inside space-y-2 lg:space-y-4">
					<li>Build apps, tools, hardware, or experiments related to something you're studying</li>
					<li>Upload your project with a short write-up</li>
					<li>Earn prizes based on effort, creativity, and usefulness</li>
				</ul>

				<div className="flex flex-row flex-wrap gap-4 lg:gap-8 2xl:gap-10 text-lg lg:text-3xl 2xl:text-4xl justify-start items-center">
					<Button
						href="https://forms.fillout.com/t/aX86bHVxqkus"
						target="_blank"
						rel="noreferrer"
						variant="yellow"
					>
						RSVP / Join YSWS
					</Button>
					<Button
						href="/beginner"
						variant="red"
					>
						See Beginner Guides
					</Button>
				</div>
			</main>
		</div>
	);
}

export default Landing;
