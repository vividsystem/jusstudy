import { useMemo, useState } from "react";
import { Navigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@client/lib/auth-client";
import { client } from "@client/lib/api-client";
import type { ProjectCategories, ProjectShipStatus } from "@server/db/schema";
import { ArrowRight, BookOpen, Clock, GitPullRequest, Globe, Search } from "lucide-react";
import { type InferResponseType } from "hono";
import { secondsToFormatTime } from "@client/lib/time";
import { clientURL } from "@client/lib/urls";
import Button from "@client/components/Button";

type PendingReviewResponse = InferResponseType<typeof client.api.reviews.pending["$get"]>;
type PendingProjectEntry = PendingReviewResponse["pendingProjects"][number];

const CATEGORY_META: Record<ProjectCategories, { color: string; dot: string }> = {
	"Web Development": { color: "bg-beige text-dark-brown border-dark-brown/25", dot: "bg-dark-brown" },
	"App Development": { color: "bg-egg-yellow text-dark-brown border-dark-brown/25", dot: "bg-dark-red" },
	"Desktop App Development": { color: "bg-beige text-dark-brown border-dark-brown/25", dot: "bg-light-brown" },
	"Game Development": { color: "bg-egg-yellow text-dark-brown border-dark-brown/25", dot: "bg-light-brown" },
	"PCB Design": { color: "bg-beige text-dark-brown border-dark-brown/25", dot: "bg-dark-red" },
	CAD: { color: "bg-egg-yellow text-dark-brown border-dark-brown/25", dot: "bg-dark-brown" },
};

const STATE_META: Record<ProjectShipStatus, { label: string; color: string; bg: string }> = {
	voting: { label: "Voting", color: "text-dark-brown", bg: "bg-egg-yellow" },
	"pre-initial": { label: "T1", color: "text-dark-brown", bg: "bg-beige" },
	"pre-payout": { label: "PP", color: "text-dark-brown", bg: "bg-beige" },
	"pre-fraud": { label: "Fraud", color: "text-dark-red", bg: "bg-dark-red" },
	failed: { label: "Failed", color: "text-dark-red", bg: "bg-dark-red" },
	finished: { label: "Finished", color: "text-light-brown", bg: "bg-light-brown" },
};

const ALL_CATEGORIES = ["All", ...Object.keys(CATEGORY_META)] as const;
const ALL_STATES = ["All", ...Object.keys(STATE_META)] as const;

type CategoryFilter = (typeof ALL_CATEGORIES)[number];
type StateFilter = (typeof ALL_STATES)[number];

function getReviewLink(shipId: string): string {
	return clientURL(`/reviews/${shipId}`).toString();
}

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const days = Math.floor(diff / 86_400_000);
	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 30) return `${days}d ago`;
	return `${Math.floor(days / 30)}mo ago`;
}

function TimeStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
	return (
		<div className={`flex flex-col items-center justify-center px-3 py-2 rounded-2xl border-4 ${highlight ? "bg-egg-yellow border-dark-red" : "bg-beige border-dark-brown"}`}>
			<span className={`text-base font-bold font-mono leading-none text-center ${highlight ? "text-dark-red" : "text-dark-brown"}`}>
				{secondsToFormatTime(value)}
			</span>
			<span className="text-dark-brown/70 text-xs mt-1 leading-none">{label}</span>
		</div>
	);
}

function CategoryBadge({ category }: { category: ProjectCategories }) {
	const meta = CATEGORY_META[category];
	return (
		<span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border-2 text-xs font-medium ${meta.color}`}>
			<span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
			{category}
		</span>
	);
}

function StatePill({ state }: { state: ProjectShipStatus }) {
	const meta = STATE_META[state];
	return (
		<span className={`inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase ${meta.color}`}>
			<span className={`w-1.5 h-1.5 rounded-full animate-pulse ${meta.bg}`} />
			{meta.label}
		</span>
	);
}

function LinkChip({ href, label, icon }: { href: string | null; label: string; icon: React.ReactNode }) {
	if (!href) return null;
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-egg-yellow border-2 border-dark-brown text-xs text-dark-brown font-medium shadow-[2px_2px_0_0_#432818] transition-transform hover:-translate-y-0.5"
		>
			{icon}
			{label}
		</a>
	);
}

function SkeletonCard() {
	return (
		<div className="flex flex-col bg-beige border-4 border-dark-brown rounded-3xl overflow-hidden shadow-[6px_6px_0_0_#432818]">
			<div className="h-2 w-full bg-dark-red" />
			<div className="flex flex-col gap-4 p-5 animate-pulse">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-2 flex-1">
						<div className="h-4 bg-dark-brown/15 rounded-md w-3/4" />
						<div className="h-3 bg-dark-brown/15 rounded-md w-1/4" />
					</div>
					<div className="h-3 bg-dark-brown/15 rounded-full w-14" />
				</div>
				<div className="h-5 bg-dark-brown/15 rounded-full w-28" />
				<div className="space-y-1.5">
					<div className="h-3 bg-dark-brown/15 rounded w-full" />
					<div className="h-3 bg-dark-brown/15 rounded w-5/6" />
				</div>
				<div className="grid grid-cols-3 gap-2">
					{[0, 1, 2].map((i) => <div key={i} className="h-12 bg-dark-brown/15 rounded-2xl" />)}
				</div>
				<div className="flex gap-2">
					<div className="h-6 bg-dark-brown/15 rounded-2xl w-16" />
					<div className="h-6 bg-dark-brown/15 rounded-2xl w-14" />
				</div>
				<div className="h-9 bg-dark-brown/15 rounded-2xl mt-1" />
			</div>
		</div>
	);
}

function ProjectCard({ entry }: { entry: PendingProjectEntry }) {
	const { projects: project, project_ship: ship } = entry;

	return (
		<div className="group relative flex flex-col bg-beige border-4 border-dark-brown rounded-3xl overflow-hidden shadow-[6px_6px_0_0_#432818] transition-transform duration-200 hover:-translate-y-1">
			<div className="h-2 w-full bg-dark-red" />

			<div className="flex flex-col gap-4 p-5 flex-1">
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<h3 className="text-base font-bold text-dark-brown leading-tight truncate title-font">{project.name}</h3>
						<div className="flex items-center gap-1.5 mt-1 text-dark-brown/70 text-xs">
							<Clock className="size-3" />
							<span>{timeAgo(ship.createdAt)}</span>
						</div>
					</div>
					<StatePill state={ship.state} />
				</div>

				<CategoryBadge category={project.category} />

				<p className="text-sm text-dark-brown leading-relaxed line-clamp-2 flex-1">
					{project.description ?? <span className="italic text-dark-brown/45">No description provided.</span>}
				</p>

				<div className="grid grid-cols-3 gap-2">
					<TimeStat label="Logged" value={ship.loggedTime} highlight />
					<TimeStat label="Spent" value={ship.timeSpent} />
					<TimeStat label="Total" value={ship.totalTime} />
				</div>

				<div className="flex flex-wrap gap-2">
					<LinkChip href={project.demoLink} label="Demo" icon={<Globe className="size-3" />} />
					<LinkChip href={project.repository} label="Repo" icon={<GitPullRequest className="size-3" />} />
					<LinkChip href={project.readmeLink} label="README" icon={<BookOpen className="size-3" />} />
				</div>
			</div>

			<div className="px-5 pb-5">
				<Button
					href={getReviewLink(entry.project_ship.id)}
					className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-dark-red border-4 border-dark-brown text-egg-yellow font-semibold text-sm shadow-[4px_4px_0_0_#432818] transition-transform hover:-translate-y-0.5 active:translate-y-0"
				>
					Start Review
					<ArrowRight className="size-4" />
				</Button>
			</div>
		</div>
	);
}

function FilterPill({
	label,
	count,
	active,
	dot,
	onClick,
}: {
	label: string;
	count: number;
	active: boolean;
	dot?: string;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium border-2 transition-all ${active
				? "bg-dark-red text-egg-yellow border-dark-brown shadow-[2px_2px_0_0_#432818]"
				: "bg-beige text-dark-brown border-dark-brown/25 hover:border-dark-brown/50"
				}`}
		>
			{dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-egg-yellow" : dot}`} />}
			{label}
			<span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-egg-yellow/20" : "bg-dark-brown/10"}`}>{count}</span>
		</button>
	);
}

export default function ReviewPortal() {
	const { data: session } = authClient.useSession();

	const { data: queryData, isPending } = useQuery({
		queryKey: ["pendingReviews"],
		queryFn: async () => {
			const res = await client.api.reviews.pending.$get();
			return res.json();
		},
	});

	if (session == null || session.user.type === "participant") {
		return <Navigate to="/" />;
	}

	const pendingProjects = queryData?.pendingProjects ?? [];

	return <ReviewPortalContent pendingProjects={pendingProjects} isLoading={isPending} />;
}

function ReviewPortalContent({ pendingProjects, isLoading }: { pendingProjects: PendingProjectEntry[]; isLoading: boolean }) {
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
	const [activeState, setActiveState] = useState<StateFilter>("All");

	const filtered = useMemo(() => {
		return pendingProjects.filter(({ projects: project, project_ship: ship }) => {
			const query = search.toLowerCase();
			const matchSearch = !search || project.name.toLowerCase().includes(query) || (project.description ?? "").toLowerCase().includes(query);
			const matchCategory = activeCategory === "All" || project.category === activeCategory;
			const matchState = activeState === "All" || ship.state === activeState;
			return matchSearch && matchCategory && matchState;
		});
	}, [pendingProjects, search, activeCategory, activeState]);

	const categoryCounts = useMemo(() => {
		const counts: Partial<Record<ProjectCategories, number>> = {};
		pendingProjects.forEach(({ projects: project }) => {
			counts[project.category] = (counts[project.category] ?? 0) + 1;
		});
		return counts;
	}, [pendingProjects]);

	const stateCounts = useMemo(() => {
		const counts: Partial<Record<ProjectShipStatus, number>> = {};
		pendingProjects.forEach(({ project_ship: ship }) => {
			counts[ship.state] = (counts[ship.state] ?? 0) + 1;
		});
		return counts;
	}, [pendingProjects]);

	const hasActiveFilters = search.length > 0 || activeCategory !== "All" || activeState !== "All";

	function clearFilters() {
		setSearch("");
		setActiveCategory("All");
		setActiveState("All");
	}

	return (
		<div className="min-h-screen bg-beige text-dark-brown w-full">
			<header className="sticky top-0 z-40 border-b-4 border-dark-brown bg-beige/95 backdrop-blur-md">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-2xl bg-dark-red border-2 border-dark-brown flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#432818]">
							<svg className="w-4 h-4 text-egg-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h1 className="text-sm font-bold text-dark-brown leading-none title-font">Review Portal</h1>
							<p className="text-xs text-dark-brown/70 leading-none mt-0.5">Hack Club Projects</p>
						</div>
					</div>

					<div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-egg-yellow border-4 border-dark-brown text-sm text-dark-brown shadow-[3px_3px_0_0_#432818]">
						{isLoading ? (
							<span className="w-20 h-4 bg-dark-brown/15 rounded animate-pulse" />
						) : (
							<>
								<span className="font-mono font-medium">{pendingProjects.length}</span>
								<span>pending review</span>
							</>
						)}
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
				<div className="space-y-4">
					<div className="relative">
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-brown/60">
							<Search className="size-5" />
						</div>
						<input
							type="text"
							placeholder="Search projects…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-11 pr-4 py-3 bg-beige border-4 border-dark-brown focus:border-dark-red rounded-3xl text-dark-brown placeholder:text-dark-brown/35 text-sm outline-none transition-colors shadow-[4px_4px_0_0_#432818]"
						/>
						{search && (
							<button
								onClick={() => setSearch("")}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-brown/60 hover:text-dark-brown text-lg leading-none"
							>
								×
							</button>
						)}
					</div>

					<div className="flex gap-2 overflow-x-auto pb-1">
						{ALL_CATEGORIES.map((category) => {
							const count = category === "All" ? pendingProjects.length : (categoryCounts[category as ProjectCategories] ?? 0);
							if (category !== "All" && count === 0) return null;
							return (
								<FilterPill
									key={category}
									label={category}
									count={count}
									active={activeCategory === category}
									onClick={() => setActiveCategory(category as CategoryFilter)}
								/>
							);
						})}
					</div>

					<div className="flex items-center gap-2 overflow-x-auto pb-1">
						<span className="shrink-0 text-xs text-dark-brown/60 font-medium mr-1">Stage:</span>
						{ALL_STATES.map((state) => {
							const count = state === "All" ? pendingProjects.length : (stateCounts[state as ProjectShipStatus] ?? 0);
							if (state !== "All" && count === 0) return null;
							const meta = state !== "All" ? STATE_META[state as ProjectShipStatus] : null;
							return (
								<FilterPill
									key={state}
									label={state === "All" ? "All stages" : meta!.label}
									count={count}
									active={activeState === state}
									dot={meta?.bg}
									onClick={() => setActiveState(state as StateFilter)}
								/>
							);
						})}
					</div>
				</div>

				<div className="flex items-center justify-between gap-4">
					<p className="text-sm text-dark-brown/70">
						{isLoading ? (
							<span className="w-32 h-4 bg-dark-brown/15 rounded animate-pulse inline-block" />
						) : filtered.length === 0 ? (
							"No projects match your filters"
						) : (
							<>
								Showing <span className="text-dark-brown font-medium">{filtered.length}</span> project{filtered.length !== 1 ? "s" : ""}
							</>
						)}
					</p>
					{hasActiveFilters && !isLoading && (
						<button
							onClick={clearFilters}
							className="text-xs text-dark-brown/60 hover:text-dark-brown underline underline-offset-2 transition-colors"
						>
							Clear filters
						</button>
					)}
				</div>

				{isLoading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
					</div>
				) : filtered.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{filtered.map((entry) => <ProjectCard key={entry.project_ship.id} entry={entry} />)}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-24 text-center space-y-3 rounded-3xl border-4 border-dark-brown bg-egg-yellow shadow-[6px_6px_0_0_#432818]">
						<div className="w-14 h-14 rounded-2xl bg-dark-red border-2 border-dark-brown flex items-center justify-center text-2xl shadow-[2px_2px_0_0_#432818]">
							🔍
						</div>
						<p className="text-dark-brown font-medium">No projects found</p>
						<p className="text-dark-brown/70 text-sm">Try adjusting your search or filters</p>
					</div>
				)}
			</main>
		</div>
	);
}
