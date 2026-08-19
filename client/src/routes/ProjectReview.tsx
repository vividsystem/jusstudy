import { useState } from "react";
import { Navigate, useParams } from "react-router";
import { authClient } from "@client/lib/auth-client";
import Button from "@client/components/Button";
import { ArrowLeft, Check, Clock, Lock, X } from "lucide-react";
import { client } from "@client/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { type InferResponseType } from "hono/client";
import { formatDate } from "@client/lib/time";
import { useErrors } from "@client/lib/context/ErrorContext";
import ReviewCard from "@client/components/reviews/ReviewCard";
import ReviewSubmissionForm from "@client/components/reviews/SubmissionForm";

type ReviewsResponse = InferResponseType<typeof client.api.projects[":id"]["reviews"]["$get"]>;

type Review = Extract<ReviewsResponse, { reviews: unknown }>["reviews"][number];

function TimelineEntry({
	review,
	// isCurrentUser,
	isLast,
}: {
	review: Review;
	// isCurrentUser: boolean;
	isLast: boolean;
}) {
	const [notesOpen, setNotesOpen] = useState(false)
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


export default function ProjectReview() {

	const { data: session } = authClient.useSession();
	const { id } = useParams();
	if (!id) {
		return <Navigate to="/reviews" />;
	}
	if (session == null || session.user.type == "participant") {
		return <Navigate to="/" />;
	}

	return <Page id={id} />
}
interface PageProps {
	id: string,
}
function Page({ id }: PageProps) {

	const { pushError } = useErrors()

	const { data, isPending } = useQuery({
		queryKey: ["review", id],
		queryFn: async () => {
			const shipRes = await client.api.ships[":id"].$get({ param: { id } });
			if (!shipRes.ok) {
				const err = await shipRes.json();
				pushError(err.message);
				throw new Error(err.message)
			}
			const { ship } = await shipRes.json();

			const projectRes = await client.api.projects[":id"].$get({ param: { id: ship.projectId } });
			if (!projectRes.ok) {
				const err = await projectRes.json();
				pushError(err.message);
				throw new Error(err.message)
			}
			const { project } = await projectRes.json();


			const userRes = await client.api.users[":id"].$get({ param: { id: project.creatorId } });
			if (!userRes.ok) {
				const err = await userRes.json();
				pushError(err.message);
				throw new Error(err.message)
			}
			const { user } = await userRes.json();

			const reviewsRes = await client.api.projects[":id"].reviews.$get({ param: { id: project.id } });
			if (!reviewsRes.ok) {
				const err = await reviewsRes.json();
				pushError(err.message);
				throw new Error(err.message)
			}
			const { reviews } = await reviewsRes.json();

			// Return everything so the component can use it
			return { ship, project, reviews, creator: user };
		},
	});


	// Show skeleton while loading — data is guaranteed non-null below this point
	if (isPending || !data) {
		return (
			<div className="min-h-screen w-full">
				<header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
					< div className="max-w-350 mx-auto px-6 py-4 flex items-center gap-4" >
						<Button href="/reviews" className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
							<ArrowLeft className="size-4" />
							Back to portal
						</Button>
					</div >
				</header >
				<p>loading...</p>
			</div >
		);
	}

	const { ship, project, reviews, creator } = data;
	if (ship.state != "pre-initial" && ship.state != "pre-fraud") {
		return <Navigate to={"/reviews"} />
	}


	return (
		<div className="min-h-screen w-full">
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
				</div>
			</header>

			<div className="w-full grid grid-cols-2 p-4">

				<div>
					<ReviewCard project={project} ship={ship} creator={creator} />
				</div>

				<div className="flex flex-col gap-4">
					<ReviewSubmissionForm shipId={ship.id} />

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
										key={r.shipId}
										review={r}
										{/*isCurrentUser={r.reviewerName === session.user.name}*/...{}}
										isLast={i === reviews.length - 1}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
