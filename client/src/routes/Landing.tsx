import HackclubLogo from "@client/components/HackclubLogo";
import { authClient } from "../lib/auth-client";
import { clientURL } from "../lib/urls";
import Button from "@client/components/Button";

const LandingContent = () => (
	<>
		<h1 className="text-4xl sm:text-6xl lg:text-9xl 2xl:text-9-5xl font-bold title-font text-[#282828] break-words">
			Jus'STUDY
		</h1>

		<p className="text-base sm:text-lg lg:text-4xl 2xl:text-5xl text-[#282828]">
			A Hack Club <span>You Ship, We Ship</span> where students build projects that help with studying, focus, learning, or school life, and earn prizes for shipping real work.
		</p>

		<ul className="text-sm sm:text-md lg:text-2xl 2xl:text-3xl list-disc list-inside space-y-2 lg:space-y-4 font-bold text-[#282828]">
			<li className="whitespace-normal">Build apps, tools, hardware, or experiments related to something you're studying</li>
			<li className="whitespace-normal">Upload your project with a short write-up</li>
			<li className="whitespace-normal">Earn prizes based on effort, creativity, and usefulness</li>
		</ul>

		<div className="flex flex-col sm:flex-row flex-wrap gap-4 lg:gap-8 2xl:gap-10 text-base sm:text-lg lg:text-3xl 2xl:text-4xl justify-start items-center">
			<Button
				href="https://forms.fillout.com/t/aX86bHVxqkus"
				target="_blank"
				rel="noreferrer"
				className="w-full sm:w-auto text-center bg-dark-red text-egg-yellow border-4 border-egg-yellow"
			>
				RSVP / Join YSWS
			</Button>
			<Button
				href="/beginner"
				className="w-full sm:w-auto text-center bg-dark-red text-egg-yellow border-4 border-egg-yellow"
			>
				See Beginner Guides
			</Button>
		</div>

		<p className="text-sm sm:text-md lg:text-2xl 2xl:text-3xl font-bold opacity-80 text-[#282828]">
			Run by students. Backed by <a href="https://hackclub.com" target="_blank" rel="noreferrer" className="underline hover:opacity-100 transition-opacity">Hack Club</a>
		</p>
	</>
);

const SponsorsBanner = () => (
	<div className="relative w-full mt-[-100px] lg:mt-[-250px] 2xl:mt-[-400px] select-none pointer-events-none overflow-hidden">
		<img
			src="/ColorBanner_4.svg"
			alt="Sponsor Banner"
			className="w-full h-auto block min-h-[120px] sm:min-h-[200px] object-cover sm:object-fill"
			onContextMenu={(e) => e.preventDefault()}
		/>
		<div className="absolute inset-0 flex flex-col items-center justify-center px-[10%] lg:px-[15%] pb-[2%] lg:pb-[5%]">
			<div className="flex flex-col gap-0 lg:gap-1 text-center mt-2 lg:mt-0">
				<h2 className="text-base sm:text-2xl lg:text-4xl 2xl:text-6xl font-bold title-font text-[#FFE6A7] leading-tight">
					Thanks to our sponsors!!!
				</h2>
			</div>
		</div>
	</div>
);

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
		<div className="relative w-full">
			{/* Navigation Elements */}
			<div className="relative z-50 w-full">
				<HackclubLogo />
				<span
					onClick={login}
					className="fixed top-8 right-8 lg:top-12 lg:right-12 text-xl lg:text-3xl 2xl:text-4xl underline opacity-80 hover:opacity-100 transition-opacity cursor-pointer text-[#282828]"
				>
					Login
				</span>
			</div>

			{/* UNIFIED LAYOUT (Stretched Desktop Scale) */}
			<div className="relative w-full overflow-hidden">
				{/* The Image Stack - Dictates Height */}
				<div className="flex flex-col w-full select-none pointer-events-none">
					<img src="/ColorBanner_1.svg" alt="Banner" className="w-full h-auto block" onContextMenu={(e) => e.preventDefault()} />
					<img src="/ColorBanner2+3.svg" alt="Banner" className="w-full h-auto block mt-[15rem] sm:mt-[25rem] lg:mt-[30rem] 2xl:mt-[40rem]" onContextMenu={(e) => e.preventDefault()} />
					<SponsorsBanner />
				</div>

				{/* The Text Content Overlay */}
				<div className="absolute top-0 left-0 w-full h-full pointer-events-none">
					<div className="pointer-events-auto flex flex-col w-[85%] lg:w-[70%] mx-auto mt-32 sm:mt-48 lg:mt-64 2xl:mt-80 gap-6 lg:gap-8 2xl:gap-10">
						<LandingContent />
					</div>
				</div>
			</div>
		</div>
	);
}

export default Landing;
