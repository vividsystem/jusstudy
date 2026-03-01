import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { authClient } from "@client/lib/auth-client";
import Button from "@client/components/Button";
import { ArrowLeft, BookOpen, Check, Clock, GitPullRequest, Globe, Lock, X } from "lucide-react";
import { client } from "@client/lib/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ProjectCategories, ProjectShipStatus, ReviewType } from "@server/db/schema";
import { type InferResponseType } from "hono/client";
import { formatDate, secondsToFormatTime } from "@client/lib/time";

// ── Inferred types from Hono client ───────────────────────────────────────
type ReviewsResponse = InferResponseType<typeof client.api.projects[":id"]["reviews"]["$get"]>;

type Review = Extract<ReviewsResponse, { reviews: unknown }>["reviews"][number];


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
	"pre-fraud": { label: "Flagged", color: "text-amber-400", bg: "bg-amber-400" },
	"failed": { label: "Failed", color: "text-red-400", bg: "bg-red-400" },
	"finished": { label: "Finished", color: "text-blue-400", bg: "bg-blue-400" },
};

// function initials(name: string): string {
// 	return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
// }

// ── Sub-components ─────────────────────────────────────────────────────────
// function Avatar({ name, src, size = "md" }: { name: string; src: string | null | undefined; size?: "sm" | "md" }) {
// 	const cls = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
// 	if (src) {
// 		return <img src={src} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />;
// 	}
// 	return (
// 		<div className={`${cls} rounded-full bg-zinc-700 flex items-center justify-center shrink-0 font-bold text-zinc-300`}>
// 			{initials(name)}
// 		</div>
// 	);
// }

function LinkButton({ href, icon, label }: { href: string | null | undefined; icon: React.ReactNode; label: string }) {
	if (!href) return null;
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-sm text-zinc-300 hover:text-white transition-all"
		>
			{icon}
			{label}
		</a>
	);
}

function TimeStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
	return (
		<div className={`flex flex-col items-center px-3 py-2.5 rounded-lg border ${highlight ? "bg-amber-500/10 border-amber-500/20" : "bg-zinc-800/60 border-zinc-700/50"
			}`}>
			<span className={`text-center font-bold font-mono leading-none ${highlight ? "text-amber-300" : "text-zinc-200"}`}>
				{secondsToFormatTime(value)}
			</span>
			<span className="text-zinc-500 text-xs mt-1">{label}</span>
		</div>
	);
}

// ── Timeline ───────────────────────────────────────────────────────────────
function TimelineEntry({
	review,
	// isCurrentUser,
	isLast,
}: {
	review: Review;
	// isCurrentUser: boolean;
	isLast: boolean;
}) {
	const [notesOpen, setNotesOpen] = useState(false);
	const passed = review.passed

	return (
		<div className="relative flex gap-3">
			<div className="flex flex-col items-center shrink-0">
				<div className={`w-2.5 h-2.5 rounded-full border-2 border-zinc-950 mt-2 z-10 ${passed ? "bg-emerald-400" : "bg-red-400"
					}`} />
				{!isLast && <div className="w-px flex-1 bg-zinc-800 mt-1" />}
			</div>

			<div className={`flex-1 mb-5 rounded-xl border overflow-hidden ${passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
				}`}>
				<div className="px-3 pt-3 pb-2.5 space-y-2">
					<div className="flex items-start justify-between gap-2">
						<div className="flex items-center gap-2 min-w-0">
							{/*<Avatar name={review.reviewerName} src={review.reviewerAvatar} size="sm" />*/}
							<div className="min-w-0">
								{/*
								<p className="text-xs font-semibold text-zinc-200 leading-none truncate">
									{review.reviewerName}
									{/*isCurrentUser && <span className="text-zinc-600 font-normal ml-1">(you)</span>
							</p>
								*/}
								<p className="text-[10px] text-zinc-600 mt-0.5 flex items-center gap-1">
									<Clock className="size-3" />
									{formatDate(review.createdAt)}
								</p>
							</div>
						</div>
						<span className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
							}`}>
							{passed ? <Check className="size-3" /> : <X className="size-3" />}
							{passed ? "Pass" : "Fail"}
						</span>
					</div>

					<p className="text-xs text-zinc-300 leading-relaxed">{review.comment}</p>
				</div>

				{"note" in review && review.note as string && (
					<div className="border-t border-white/5">
						<button
							onClick={() => setNotesOpen((o) => !o)}
							className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-all"
						>
							<Lock className="size-3" />
							<span>Internal notes</span>
							<span className="ml-auto">{notesOpen ? "▲" : "▼"}</span>
						</button>
						{notesOpen && (
							<div className="px-3 pb-3">
								<div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
									<p className="text-[11px] text-amber-200/60 leading-relaxed">
										{review.note as string}
									</p>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div >
	);
}

// ── Review Form ────────────────────────────────────────────────────────────
function ReviewForm({ reviewType, shipId }: { reviewType: ReviewType, shipId: string }) {
	const [passed, setPassed] = useState(false);
	const [comment, setComment] = useState("");
	const [note, setNotes] = useState<string | undefined>();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const navigate = useNavigate()

	const { mutate: submitReview } = useMutation({
		mutationFn: async () => {
			const res = await client.api.ships[":id"].reviews.$post({
				param: {
					id: shipId
				},
				json: {
					passed,
					comment,
					note,
					type: reviewType
				}
			})

			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message)
			}


			navigate("/reviews")
		},
		throwOnError: true
	})

	async function handleSubmit() {
		setError(null);
		setSubmitting(true);
		try {
			console.log(passed, comment, note, reviewType)
			submitReview()
			setSubmitting(false)
		} catch (e: any) {
			setSubmitting(false);
			setError((e as Error).message)
			throw e
		}
	}

	return (
		<div className="space-y-5">
			<div className="space-y-2">
				<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Verdict</label>
				<div className="grid grid-cols-2 gap-3">
					<button
						onClick={() => setPassed(true)}
						className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${passed
							? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10"
							: "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
							}`}
					>
						<Check className="size-5" />
						Pass
					</button>
					<button
						onClick={() => setPassed(false)}
						className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${!passed
							? "bg-red-500/20 border-red-500/50 text-red-300 shadow-lg shadow-red-500/10"
							: "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
							}`}
					>
						<X className="size-5" />
						Fail
					</button>
				</div>
			</div>

			<div className="space-y-1.5">
				<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
					Comment
					<span className="text-red-500">*</span>
					<span className="text-zinc-600 font-normal normal-case">— visible to creator</span>
				</label>
				<textarea
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Explain your decision clearly and constructively…"
					rows={4}
					className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl text-sm text-white placeholder-zinc-600 outline-none resize-none transition-colors leading-relaxed"
				/>
				<p className="text-[11px] text-zinc-600 text-right">
					{comment.trim().length === 0 ? "Required" : `${comment.length} chars`}
				</p>
			</div>

			<div className="space-y-1.5">
				<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
					<Lock className="size-3" />
					Internal notes
					<span className="text-zinc-600 font-normal normal-case">— reviewers only, optional</span>
				</label>
				<textarea
					value={note}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Red flags, patterns, context for the next reviewer…"
					rows={3}
					className="w-full px-4 py-3 bg-amber-500/5 border border-amber-500/15 focus:border-amber-500/35 rounded-xl text-sm text-zinc-300 placeholder-zinc-600 outline-none resize-none transition-colors leading-relaxed"
				/>
			</div>

			{error && (
				<p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
					{error}
				</p>
			)}

			<button
				onClick={handleSubmit}
				className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${passed
					? "bg-emerald-500 hover:bg-emerald-400 text-white active:scale-[0.98] shadow-lg shadow-emerald-500/20"
					: "bg-red-500 hover:bg-red-400 text-white active:scale-[0.98] shadow-lg shadow-red-500/20"
					}`}
			>
				{submitting ? (
					<>
						<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
						Submitting…
					</>
				) : passed ? (
					<><Check className="size-5" /> Submit Pass</>
				) : !passed ? (
					<><X className="size-5" /> Submit Fail</>
				) : (
					"Select a verdict to continue"
				)}
			</button>
		</div>
	);
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function PageSkeleton() {
	return (
		<div className="max-w-350 mx-auto px-6 py-8">
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_400px] xl:grid-cols-[1fr_300px_420px] gap-6 items-start animate-pulse">
				<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
					<div className="h-7 bg-zinc-800 rounded-lg w-2/3" />
					<div className="h-4 bg-zinc-800 rounded w-1/4" />
					<div className="space-y-2">
						<div className="h-3 bg-zinc-800 rounded w-full" />
						<div className="h-3 bg-zinc-800 rounded w-5/6" />
						<div className="h-3 bg-zinc-800 rounded w-4/6" />
					</div>
					<div className="grid grid-cols-3 gap-2.5">
						{[0, 1, 2].map((i) => <div key={i} className="h-14 bg-zinc-800 rounded-lg" />)}
					</div>
					<div className="flex gap-2">
						<div className="h-9 bg-zinc-800 rounded-lg w-24" />
						<div className="h-9 bg-zinc-800 rounded-lg w-24" />
					</div>
				</div>
				<div className="space-y-3">
					<div className="h-4 bg-zinc-800 rounded w-1/2" />
					<div className="h-24 bg-zinc-800 rounded-xl" />
					<div className="h-24 bg-zinc-800 rounded-xl" />
				</div>
				<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
					<div className="h-5 bg-zinc-800 rounded w-1/2" />
					<div className="grid grid-cols-2 gap-3">
						<div className="h-12 bg-zinc-800 rounded-xl" />
						<div className="h-12 bg-zinc-800 rounded-xl" />
					</div>
					<div className="h-28 bg-zinc-800 rounded-xl" />
					<div className="h-20 bg-zinc-800 rounded-xl" />
					<div className="h-12 bg-zinc-800 rounded-xl" />
				</div>
			</div>
		</div>
	);
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ProjectReview() {
	const { data: session } = authClient.useSession();
	const { id } = useParams();

	if (!id) {
		return <Navigate to="/reviews" />;
	}

	if (session == null || session.user.type == "participant") {
		return <Navigate to="/" />;
	}

	const { data, isPending } = useQuery({
		queryKey: ["review", id],
		queryFn: async () => {
			const shipRes = await client.api.ships[":id"].$get({ param: { id } });
			if (!shipRes.ok) {
				const err = await shipRes.json();
				throw new Error(err.message);
			}
			const { ship } = await shipRes.json();

			const projectRes = await client.api.projects[":id"].$get({ param: { id: ship.projectId } });
			if (!projectRes.ok) {
				const err = await projectRes.json();
				throw new Error(err.message);
			}
			const { project } = await projectRes.json();

			const reviewsRes = await client.api.projects[":id"].reviews.$get({ param: { id: project.id } });
			if (!reviewsRes.ok) {
				const err = await reviewsRes.json();
				throw new Error(err.message);
			}
			const { reviews } = await reviewsRes.json();

			// Return everything so the component can use it
			return { ship, project, reviews };
		},
		throwOnError: true,
	});


	// Show skeleton while loading — data is guaranteed non-null below this point
	if (isPending || !data) {
		return (
			<div className="min-h-screen bg-zinc-950 text-white">
				<header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
					<div className="max-w-350 mx-auto px-6 py-4 flex items-center gap-4">
						<Button href="/reviews" className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
							<ArrowLeft className="size-4" />
							Back to portal
						</Button>
					</div>
				</header>
				<PageSkeleton />
			</div>
		);
	}

	const { ship, project, reviews } = data;
	if (ship.state != "pre-initial" && ship.state != "pre-fraud") {
		return <Navigate to={"/reviews"} />
	}

	const catMeta = CATEGORY_META[project.category];
	const stateMeta = STATE_META[ship.state];

	return (
		<div className="min-h-screen bg-zinc-950 text-white">
			{/* ── Header ── */}
			<header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
				<div className="max-w-350 mx-auto px-6 py-4 flex items-center gap-4">
					<Button
						href="/reviews"
						className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
					>
						<ArrowLeft className="size-4" />
						Back to portal
					</Button>
					<div className="w-px h-4 bg-zinc-800 shrink-0" />
					<div className="flex items-center gap-2 min-w-0">
						<span className={`w-2 h-2 rounded-full shrink-0 ${stateMeta.bg}`} />
						<span className="text-sm text-zinc-400 truncate">
							Reviewing <span className="text-white font-semibold">{project.name}</span>
						</span>
					</div>
					<div className="ml-auto shrink-0">
						<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${catMeta.color}`}>
							<span className={`w-1.5 h-1.5 rounded-full ${catMeta.dot}`} />
							{project.category}
						</span>
					</div>
				</div>
			</header>

			{/* ── Three-column body ── */}
			<div className="max-w-350 mx-auto px-6 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_400px] xl:grid-cols-[1fr_300px_420px] gap-6 items-start">

					{/* ── COL 1: Project details ── */}
					<div className="min-w-0">
						<div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
							<div className="h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent" />
							<div className="p-6 space-y-5">
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-2 min-w-0">
										<h1 className="text-2xl font-bold text-white leading-tight">{project.name}</h1>
										{/*
										<div className="flex items-center gap-2">
											<span className="text-sm text-zinc-400">
												by <span className="text-zinc-200 font-medium">{project.creatorName}</span>
											</span>
										</div>
										*/}
									</div>
									<span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase ${stateMeta.color}`}>
										<span className={`w-1.5 h-1.5 rounded-full animate-pulse ${stateMeta.bg}`} />
										{stateMeta.label}
									</span>
								</div>

								{project.description && (
									<p className="text-sm text-zinc-300 leading-relaxed">{project.description}</p>
								)}

								<div className="grid grid-cols-3 gap-2.5">
									<TimeStat label="Logged" value={ship.loggedTime} highlight />
									<TimeStat label="Spent" value={ship.timeSpent} />
									<TimeStat label="Total" value={ship.totalTime} />
								</div>

								<div className="flex flex-wrap gap-2">
									<LinkButton href={project.demoLink} icon={<Globe className="size-3.5" />} label="Live demo" />
									<LinkButton href={project.repository} icon={<GitPullRequest className="size-3.5" />} label="Repository" />
									<LinkButton href={project.readmeLink} icon={<BookOpen className="size-3.5" />} label="README" />
								</div>
							</div>
						</div>
					</div>

					{/* ── COL 2: Review history timeline ── */}
					<div className="lg:sticky lg:top-18.25 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto pr-1">
						<div className="mb-4 flex items-center gap-2">
							<h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
								Review history
							</h2>
							<div className="flex-1 h-px bg-zinc-800" />
							<span className="text-xs text-zinc-600 font-mono shrink-0">{reviews.length}</span>
						</div>

						{reviews.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-10 text-center">
								<p className="text-zinc-600 text-xs">No previous reviews</p>
								<p className="text-zinc-700 text-[11px] mt-1">Be the first to review</p>
							</div>
						) : (
							<div>
								{reviews.map((r, i) => (
									<TimelineEntry
										key={r.id}
										review={r}
										{/*isCurrentUser={r.reviewerName === session.user.name}*/...{}}
										isLast={i === reviews.length - 1}
									/>
								))}
							</div>
						)}
					</div>

					{/* ── COL 3: Review form ── */}
					<div className="lg:sticky lg:top-18.25">
						<div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
							<div className="h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent" />
							<div className="p-6">
								<h2 className="text-base font-bold text-white mb-0.5">Submit your review</h2>
								<p className="text-xs text-zinc-500 mb-5">
									Your decision will affect this project's status.
								</p>
								<ReviewForm reviewType={ship.state as unknown as ReviewType} shipId={ship.id} />
							</div>
						</div>
					</div>

				</div>
			</div>
		</div>
	);
}
