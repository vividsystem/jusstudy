import HackclubLogo from "@client/components/HackclubLogo";
import { authClient } from "../lib/auth-client";
import { clientURL } from "../lib/urls";
import Button from "@client/components/Button";
import RewardBox from "@client/components/RewardBox";
import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";

const rewardItems = [
	{ src: "/reward/book.png", label: "Book Grant" },
	{ src: "/reward/chair.png", label: "Office Chair" },
	{ src: "/reward/domain.png", label: "Domain Grant" },
	{ src: "/reward/macbook.png", label: "Laptop Grant" },
	{ src: "/reward/notebook.png", label: "Notebook" },
	{ src: "/reward/rubberduck.png", label: "Rubber Duck" },
	{ src: "/reward/stationary.png", label: "Stationary Grant" },
	{ src: "/reward/apple-pencil.png", label: "Stylus Grant" },
	{ src: "/reward/ipad.png", label: "Tablet Grant" },
	{ src: "../public/codecrafters.png", label: "Code Crafters Membership" },
] as const;

const LandingContent = () => (
	<>
		<div className="height-32">
			<img src="/logo_landing.svg" />
		</div>

		<p className="text-base sm:text-lg lg:text-5xl 2xl:text-6xl text-[#282828]">
			A Hack Club <span>You Ship, We Ship</span> where students build projects that help with studying, focus, learning, or school life, and earn prizes for shipping real work.
		</p>

		<ul className="text-sm sm:text-md lg:text-3xl 2xl:text-4xl list-disc list-inside space-y-2 lg:space-y-4 font-bold text-[#282828]">
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
				href="/guides"
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
	<div className="bg-dark-brown p-20">
		<h2 className="text-base sm:text-2xl lg:text-4xl 2xl:text-6xl font-bold title-font text-[#FFE6A7] leading-tight">
			Thanks to our sponsors!!!
		</h2>
	</div>
);
const rewardItemsWithRotations = rewardItems.map((item) => {
	const magnitude = Math.floor(Math.random() * 5) + 2;
	const sign = Math.random() < 0.5 ? -1 : 1;
	return { ...item, rotation: sign * magnitude };
});

function MarqueeRow({ items, direction }: {
	items: typeof rewardItemsWithRotations;
	direction: 'left' | 'right';
}) {
	const animClass = direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';

	return (
		<div className="overflow-hidden p-4">
			<ul className={`flex w-max gap-4 ${animClass} hover:[animation-play-state:paused]`}>
				{[...items, ...items].map((item, idx) => (
					<li key={idx} className="shrink-0" aria-hidden={idx >= items.length}>
						<RewardBox src={item.src} label={item.label} rotationDeg={item.rotation} />
					</li>
				))}
			</ul>
		</div>
	);
}

export function RewardCarousel() {
	return (
		<div className="w-full flex flex-col">
			<div className="bg-egg-yellow py-12">
				<MarqueeRow items={rewardItemsWithRotations} direction="left" />
			</div>
			<div className="bg-beige py-12">
				<MarqueeRow items={rewardItemsWithRotations} direction="right" />
			</div>
		</div>
	);
}

function FAQSection({ question, answer }: { question: string, answer: React.ReactNode }) {
	const [open, setOpen] = useState(false)
	return (
		<div className="border-dark-red border-2 text-dark-red bg-egg-yellow rounded-4xl text-3xl lg:text-5xl w-full">
			<div className="flex flex-row justify-between items-center p-4" onClick={() => setOpen(!open)}>
				<h3>{question}</h3>
				{open ? (
					<ChevronDown className="size-8" />
				) : <ChevronLeft className="size-8" />}
			</div>
			{open && (<>
				<div className="border-t-dark-red border-t-4 p-4">
					{answer}
				</div>
			</>)}

		</div>
	)

}
function FAQ() {
	return (
		<div className="w-full flex flex-col items-center py-16">

			<h2 className="text-4xl lg:text-8xl">FAQ</h2>
			<div className="flex flex-col gap-4 w-1/2">
				<FAQSection question="What is this?" answer={(<p>
					Jus'STUDY is a YSWS event organized by high schoolers for high schoolers. It is focused specifically on improving the way we learn. Whether it's a software app to track your grades or a hardware device to keep your desk organised, if it helps you study, it belongs here.
				</p>)} />
				<FAQSection question="How much does it cost?" answer={(<p>100% free - all the prizes are donated to us or paid for by us! (customs might occur)</p>)} />
				<FAQSection question="Am I eligible to participate?" answer={(<p>Jus'Study is for highschoolers! You need to be 13-18 years old to participate.</p>)} />
				<FAQSection question="When will this end?" answer={(<p>Jus'Study will run until the 20th of April 2026</p>)} />
				<FAQSection question="I am a beginner can I still participate?" answer={(<p>Yes! We also have guides available to help you learn new topics</p>)} />
				<FAQSection question="How will I track my time?" answer={(<div>We use <a href="https://hackatime.hackclub.com/" className="underline underline-offset-2">Hackatime</a>.</div>)} />
				<FAQSection question="What is HackClub?" answer={(<p>Hack Club is a 501(c)(3) nonprofit and network of 60k+ technical high schoolers.</p>)} />
			</div>


		</div>
	)
}

function Footer() {
	return (
		<footer className="relative h-fit w-full">

			<img src="/ColorBanner_5.svg" alt="Banner" className="w-full h-auto block -z-10 absolute top-0 left-0 right-0" onContextMenu={(e) => e.preventDefault()} />
			<div className="px-4 py-16 md:py-32 lg:py-64 2xl:py-128">
				<h2 className="text-white lg:text-5xl">Our staff</h2>
			</div>

		</footer>

	)
}
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
		<div className="w-full">
			<div className="max-h-screen mb-40">
				<img src="/ColorBanner_1.svg" alt="Banner" className="w-full h-auto block -z-10 absolute top-0 left-0 right-0" onContextMenu={(e) => e.preventDefault()} />
				<HackclubLogo />
				<button
					onClick={login}
					className="fixed top-8 right-8 lg:top-12 lg:right-12 text-xl lg:text-3xl 2xl:text-4xl underline opacity-80 hover:opacity-100 transition-opacity cursor-pointer text-[#282828]"
				>
					Login
				</button>

				<div className="left-0 w-full pointer-events-none">
					<div className="pointer-events-auto flex flex-col w-5/6 mx-auto mt-32 sm:mt-48 lg:mt-64 2xl:mt-80 gap-6 lg:gap-8 2xl:gap-10">
						<LandingContent />
					</div>
				</div>
			</div>

			<RewardCarousel />
			<SponsorsBanner />
			<FAQ />
			<Footer />
		</div >
	);
}

export default Landing;
