import { useState, useMemo } from "react";
import { Navigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@client/lib/auth-client";
import { client } from "@client/lib/api-client";
import type { ProjectCategories, ProjectShipStatus } from "@server/db/schema";
import { Search, X } from "lucide-react";
import { type InferResponseType } from "hono";
import { PreviewReviewCard, CardSkeleton } from "@client/components/reviews/ReviewCard";

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
	"PCB Design": { color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", dot: "bg-yellow-400" },
	"CAD": { color: "bg-teal-500/15 text-teal-300 border-teal-500/30", dot: "bg-teal-400" },
};

const STATE_META: Record<ProjectShipStatus, { label: string; color: string; bg: string }> = {
	"voting": { label: "Voting", color: "text-emerald-400", bg: "bg-emerald-400" },
	"pre-initial": { label: "T1", color: "text-zinc-400", bg: "bg-zinc-400" },
	"pre-payout": { label: "PP", color: "text-zinc-400", bg: "bg-zinc-400" },
	"pre-fraud": { label: "Fraud", color: "text-amber-400", bg: "bg-amber-400" },
	"failed": { label: "Failed", color: "text-red-400", bg: "bg-red-400" },
	"finished": { label: "Finished", color: "text-blue-400", bg: "bg-blue-400" },
};

const ALL_CATEGORIES = ["All", ...Object.keys(CATEGORY_META)] as const;
const ALL_STATES = ["All", ...Object.keys(STATE_META)] as const;

type CategoryFilter = (typeof ALL_CATEGORIES)[number];
type StateFilter = (typeof ALL_STATES)[number];

function FilterPill({
	label,
	count,
	active,
	onClick,
}: {
	label: string;
	count: number;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${active
				? "bg-dark-red text-egg-yellow border-egg-yellow"
				: "border-dark-red bg-egg-yellow text-dark-red"
				}`}
		>
			{label}
			<span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-egg-yellow text-dark-red" : "bg-dark-red text-egg-yellow"}`}>
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
			return data.pendingProjects;
		},
	});

	// Auth guard — renders after hooks to satisfy Rules of Hooks
	if (session == null || session.user.type == "participant") {
		return <Navigate to="/" />;
	}

	const pendingProjects = queryData ?? [];

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
		return pendingProjects.filter(({ projects: p, project_ships: ship }) => {
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
		const counts: Partial<Record<ProjectShipStatus, number>> = {};
		pendingProjects.forEach(({ project_ships: ship }) => {
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
		<div className="min-h-screen text-light-brown w-full">

			{/* Redirect overlay */}
			{redirecting && (
				<div className="fixed inset-0 z-50 flex items-center border border-dark-red justify-center backdrop-blur-sm">
					<div className="text-center space-y-4">
						<div className="w-12 h-12 border-2 border-dark-red/20 border-t-dark-red rounded-full animate-spin mx-auto" />
						<p className="">Opening review for</p>
						<p className="text-beige text-sm">{redirecting}</p>
					</div>
				</div>
			)}

			{/* Header */}
			<header className="sticky top-0 z-40 border-b backdrop-blur-xl">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
					<div className="flex items-center gap-3">
						<div>
							<h1 className="text-4xl font-bold text-dark-brown leading-none">Review Portal</h1>
						</div>
					</div>

					<div className="flex items-center gap-2 p-4 rounded-2xl bg-dark-red border text-xl text-light-brown">
						{isLoading ? (
							<span className="w-20 h-4 bg-egg-yellow rounded animate-pulse" />
						) : (
							<>
								<span className="font-mono-custom text-egg-yellow font-medium">{pendingProjects.length}</span>
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
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-egg-yellow">
							<Search />
						</div>
						<input
							type="text"
							placeholder="Search projects…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-11 pr-4 py-3 focus:bg-light-brown border-2 border-egg-yellow bg-dark-red rounded-xl text-egg-yellow text-sm outline-none transition-colors"
						/>
						{search && (
							<button
								onClick={() => setSearch("")}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-beige hover:text-egg-yellow text-lg leading-none"
							>
								<X />
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
						<span className="shrink-0 mr-1">Stage:</span>
						{ALL_STATES.map((s) => {
							const count = s === "All" ? pendingProjects.length : (stateCounts[s as ProjectShipStatus] ?? 0);
							if (s !== "All" && count === 0) return null;
							const meta = s !== "All" ? STATE_META[s as ProjectShipStatus] : null;
							return (
								<FilterPill
									key={s}
									label={s === "All" ? "All stages" : meta!.label}
									count={count}
									active={activeState === s}
									onClick={() => setActiveState(s as StateFilter)}
								/>
							);
						})}
					</div>
				</div>

				<div className="flex items-center justify-between">
					<p className="text-md">
						{isLoading ? (
							<span className="w-32 h-4 rounded animate-pulse inline-block" />
						) : filtered.length !== 0 && (
							<>
								Showing{" "}
								<span className="">{filtered.length}</span>{" "}
								project{filtered.length !== 1 ? "s" : ""}
							</>
						)}
					</p>
					{hasActiveFilters && !isLoading && (
						<button
							onClick={clearFilters}
							className="text-2xl underline underline-offset-2 transition-colors"
						>
							Clear filters
						</button>
					)}
				</div>
				{/* Grid */}
				{isLoading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
					</div>
				) : filtered.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{filtered.map((entry) => (
							<PreviewReviewCard key={entry.project_ships.id} ship={{ ...entry.project_ships, timeShipped: entry.timeShipped }} project={entry.projects} />
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
						<Search />
						<p className="">No projects found</p>
						<p className="">Try adjusting your search or filters</p>
					</div>
				)}
			</main>
		</div>
	);
}
