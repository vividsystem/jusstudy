import { useState, useMemo } from "react";
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

type ProjectShipState =
	| "pre-initial"
	| "voting"
	| "pre-fraud"
	| "failed"
	| "finished";

type PendingReviewResponse = InferResponseType<
	typeof client.api.reviews.pending["$get"]
>
type PendingProjectEntry = PendingReviewResponse["pendingProjects"][number]

// ── Helpers ────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<ProjectCategories, { color: string; dot: string }> = {
	"Web Development": { color: "bg-sky-500/15 text-sky-300 border-sky-500/30", dot: "bg-sky-400" },
	"App Development": { color: "bg-violet-500/15 text-violet-300 border-violet-500/30", dot: "bg-violet-400" },
	"Desktop App Development": { color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30", dot: "bg-indigo-400" },
	"Game Development": { color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
	"Music": { color: "bg-pink-500/15 text-pink-300 border-pink-500/30", dot: "bg-pink-400" },
	"Art": { color: "bg-orange-500/15 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
	"PCB Design": { color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", dot: "bg-yellow-400" },
	"CAD": { color: "bg-teal-500/15 text-teal-300 border-teal-500/30", dot: "bg-teal-400" },
};

const STATE_META: Record<ProjectShipStatus, { label: string; color: string; bg: string }> = {
	"voting": { label: "Voting", color: "text-emerald-400", bg: "bg-emerald-400" },
	"pre-initial": { label: "T1", color: "text-zinc-400", bg: "bg-zinc-400" },
	"pre-fraud": { label: "Fraud", color: "text-amber-400", bg: "bg-amber-400" },
	"failed": { label: "Failed", color: "text-red-400", bg: "bg-red-400" },
	"finished": { label: "Finished", color: "text-blue-400", bg: "bg-blue-400" },
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

// ── Sub-components ─────────────────────────────────────────────────────────
function TimeStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
	return (
		<div className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border ${highlight ? "bg-amber-500/10 border-amber-500/25" : "bg-white/3 border-white/8"
			}`}>
			<span className={`text-base font-bold font-mono-custom leading-none ${highlight ? "text-amber-300" : "text-zinc-200"} text-center`}>
				{secondsToFormatTime(value)}
			</span>
			<span className="text-zinc-500 text-xs mt-1 leading-none">{label}</span>
		</div>
	);
}

function CategoryBadge({ category }: { category: ProjectCategories }) {
	const meta = CATEGORY_META[category];
	return (
		<span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${meta.color}`}>
			<span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
			{category}
		</span>
	);
}

function StatePill({ state }: { state: ProjectShipState }) {
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
			className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-zinc-400 hover:text-zinc-200 transition-all"
		>
			{icon}
			{label}
		</a>
	);
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonCard() {
	return (
		<div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
			<div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
			<div className="flex flex-col gap-4 p-5 animate-pulse">
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-2 flex-1">
						<div className="h-4 bg-zinc-800 rounded-md w-3/4" />
						<div className="h-3 bg-zinc-800 rounded-md w-1/4" />
					</div>
					<div className="h-3 bg-zinc-800 rounded-full w-14" />
				</div>
				<div className="h-5 bg-zinc-800 rounded-full w-28" />
				<div className="space-y-1.5">
					<div className="h-3 bg-zinc-800 rounded w-full" />
					<div className="h-3 bg-zinc-800 rounded w-5/6" />
				</div>
				<div className="grid grid-cols-3 gap-2">
					{[0, 1, 2].map((i) => <div key={i} className="h-12 bg-zinc-800 rounded-lg" />)}
				</div>
				<div className="flex gap-2">
					<div className="h-6 bg-zinc-800 rounded-md w-16" />
					<div className="h-6 bg-zinc-800 rounded-md w-14" />
				</div>
				<div className="h-9 bg-zinc-800 rounded-xl mt-1" />
			</div>
		</div>
	);
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({
	entry,
}: {
	entry: PendingProjectEntry;
}) {
	const { projects: p, project_ship: ship } = entry;

	return (
		<div className="group relative flex flex-col bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-0.5">
			<div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

			<div className="flex flex-col gap-4 p-5 flex-1">
				{/* Header */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<h3 className="text-base font-bold text-white leading-tight truncate font-display">{p.name}</h3>
						<div className="flex items-center gap-1.5 mt-1 text-zinc-500 text-xs">
							<Clock className="size-3" />
							<span>{timeAgo(ship.createdAt)}</span>
						</div>
					</div>
					<StatePill state={ship.state} />
				</div>

				<CategoryBadge category={p.category} />

				<p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 flex-1">
					{p.description ?? <span className="italic text-zinc-600">No description provided.</span>}
				</p>

				{/* Time stats */}
				<div className="grid grid-cols-3 gap-2">
					<TimeStat label="Logged" value={ship.loggedTime} highlight />
					<TimeStat label="Spent" value={ship.timeSpent} />
					<TimeStat label="Total" value={ship.totalTime} />
				</div>

				{/* Links */}
				<div className="flex flex-wrap gap-2">
					<LinkChip href={p.demoLink} label="Demo" icon={<Globe className="size-3" />} />
					<LinkChip href={p.repository} label="Repo" icon={<GitPullRequest className="size-3" />} />
					<LinkChip href={p.readmeLink} label="README" icon={<BookOpen />} />
				</div>
			</div>

			<div className="px-5 pb-5">
				<Button
					href={getReviewLink(entry.project_ship.id)}
					className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-900 font-semibold text-sm hover:bg-zinc-100 active:scale-95 transition-all duration-150 group-hover:shadow-lg group-hover:shadow-white/10"
				>
					Start Review
					<ArrowRight />
				</Button>
			</div>
		</div>
	);
}

// ── Filter Pill ────────────────────────────────────────────────────────────
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
			className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active
				? "bg-white text-zinc-900 border-white"
				: "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
				}`}
		>
			{dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-zinc-600" : dot}`} />}
			{label}
			<span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-black/10" : "bg-zinc-800 text-zinc-500"}`}>
				{count}
			</span>
		</button>
	);
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ReviewPortal() {
	const { data: session } = authClient.useSession();

	const { data: queryData, isPending } = useQuery({
		queryKey: ["pendingReviews"],
		queryFn: async () => {
			const res = await client.api.reviews.pending.$get()
			const data = await res.json();
			return data;
		},
		throwOnError: true,
	});

	// Auth guard — renders after hooks to satisfy Rules of Hooks
	if (session == null || session.user.type == "participant") {
		return <Navigate to="/" />;
	}

	const pendingProjects = queryData?.pendingProjects ?? [];

	return <ReviewPortalContent pendingProjects={pendingProjects} isLoading={isPending} />;
}

// ── Inner content (keeps hooks above auth guard clean) ─────────────────────
function ReviewPortalContent({
	pendingProjects,
	isLoading,
}: {
	pendingProjects: PendingProjectEntry[];
	isLoading: boolean;
}) {
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
	const [activeState, setActiveState] = useState<StateFilter>("All");
	const [redirecting] = useState<string | null>(null);

	const filtered = useMemo(() => {
		return pendingProjects.filter(({ projects: p, project_ship: ship }) => {
			const q = search.toLowerCase();
			const matchSearch =
				!search ||
				p.name.toLowerCase().includes(q) ||
				(p.description ?? "").toLowerCase().includes(q);
			const matchCat = activeCategory === "All" || p.category === activeCategory;
			const matchState = activeState === "All" || ship.state === activeState;
			return matchSearch && matchCat && matchState;
		});
	}, [pendingProjects, search, activeCategory, activeState]);

	const categoryCounts = useMemo(() => {
		const counts: Partial<Record<ProjectCategories, number>> = {};
		pendingProjects.forEach(({ projects: p }) => {
			counts[p.category] = (counts[p.category] ?? 0) + 1;
		});
		return counts;
	}, [pendingProjects]);

	const stateCounts = useMemo(() => {
		const counts: Partial<Record<ProjectShipState, number>> = {};
		pendingProjects.forEach(({ project_ship: ship }) => {
			counts[ship.state] = (counts[ship.state] ?? 0) + 1;
		});
		return counts;
	}, [pendingProjects]);

	const hasActiveFilters = search || activeCategory !== "All" || activeState !== "All";

	function clearFilters() {
		setSearch("");
		setActiveCategory("All");
		setActiveState("All");
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-white w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .font-display     { font-family: 'DM Sans', sans-serif; }
        .font-mono-custom { font-family: 'DM Mono', monospace; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

			{/* Redirect overlay */}
			{redirecting && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
					<div className="text-center space-y-4">
						<div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
						<p className="text-white font-semibold">Opening review for</p>
						<p className="text-zinc-300 font-mono-custom text-sm">{redirecting}</p>
					</div>
				</div>
			)}

			{/* Header */}
			<header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
					<div className="flex items-center gap-3">
						<div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
							<svg className="w-4 h-4 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h1 className="text-sm font-bold text-white leading-none">Review Portal</h1>
							<p className="text-xs text-zinc-500 leading-none mt-0.5">Hack Club Projects</p>
						</div>
					</div>

					<div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
						{isLoading ? (
							<span className="w-20 h-4 bg-zinc-800 rounded animate-pulse" />
						) : (
							<>
								<span className="font-mono-custom text-white font-medium">{pendingProjects.length}</span>
								<span>pending review</span>
							</>
						)}
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
				{/* Controls */}
				<div className="space-y-4">
					{/* Search */}
					<div className="relative">
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
							<Search />
						</div>
						<input
							type="text"
							placeholder="Search projects…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-colors"
						/>
						{search && (
							<button
								onClick={() => setSearch("")}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-lg leading-none"
							>
								×
							</button>
						)}
					</div>

					{/* Category filter */}
					<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
						{ALL_CATEGORIES.map((cat) => {
							const count = cat === "All" ? pendingProjects.length : (categoryCounts[cat as ProjectCategories] ?? 0);
							if (cat !== "All" && count === 0) return null;
							return (
								<FilterPill
									key={cat}
									label={cat}
									count={count}
									active={activeCategory === cat}
									onClick={() => setActiveCategory(cat as CategoryFilter)}
								/>
							);
						})}
					</div>

					{/* State filter */}
					<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
						<span className="shrink-0 text-xs text-zinc-600 font-medium mr-1">Stage:</span>
						{ALL_STATES.map((s) => {
							const count = s === "All" ? pendingProjects.length : (stateCounts[s as ProjectShipState] ?? 0);
							if (s !== "All" && count === 0) return null;
							const meta = s !== "All" ? STATE_META[s as ProjectShipState] : null;
							return (
								<FilterPill
									key={s}
									label={s === "All" ? "All stages" : meta!.label}
									count={count}
									active={activeState === s}
									dot={meta?.bg}
									onClick={() => setActiveState(s as StateFilter)}
								/>
							);
						})}
					</div>
				</div>

				{/* Results bar */}
				<div className="flex items-center justify-between">
					<p className="text-sm text-zinc-500">
						{isLoading ? (
							<span className="w-32 h-4 bg-zinc-800 rounded animate-pulse inline-block" />
						) : filtered.length === 0 ? (
							"No projects match your filters"
						) : (
							<>
								Showing{" "}
								<span className="text-zinc-300 font-medium">{filtered.length}</span>{" "}
								project{filtered.length !== 1 ? "s" : ""}
							</>
						)}
					</p>
					{hasActiveFilters && !isLoading && (
						<button
							onClick={clearFilters}
							className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
						>
							Clear filters
						</button>
					)}
				</div>

				{/* Grid */}
				{isLoading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
					</div>
				) : filtered.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{filtered.map((entry) => (
							<ProjectCard key={entry.project_ship.id} entry={entry} />
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
						<div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl">
							🔍
						</div>
						<p className="text-zinc-400 font-medium">No projects found</p>
						<p className="text-zinc-600 text-sm">Try adjusting your search or filters</p>
					</div>
				)}
			</main>
		</div>
	);
}
