import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { useQuery } from "@tanstack/react-query";
import type { InferResponseType } from "hono";
import { Clock, ArrowDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Avatar } from "../UserIcon";
import { timeAgo } from "@client/lib/time";

type ReviewsResponse = InferResponseType<typeof client.api.projects[":id"]["reviews"]["$get"]>;

type Review = Extract<ReviewsResponse, { reviews: unknown }>["reviews"][number];

function TimelineEntry({
	review,
}: {
	review: Review;
}) {
	const [notesOpen, setNotesOpen] = useState(false)
	const { pushError } = useErrors()

	const { data: reviewer } = useQuery({
		queryKey: ["user", review.reviewerId],
		queryFn: async () => {
			const res = await client.api.users[":id"].$get({ param: { id: review.reviewerId } })
			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}
			const data = await res.json()

			return data.user
		}

	})

	return (
		<div className={`${review.passed ? "border-l-green-400" : "border-l-red-400"} border-l-8 p-4 rounded-lg flex flex-col gap-2 bg-egg-yellow border-y-2 border-r-2 border-dark-red`}>
			<div className="flex gap-2 items-center">
				{reviewer && (<>
					<Avatar imageURL={reviewer.image} size={8} />
					<span>{reviewer.nickname}</span>
				</>)}
				<Clock />
				<span>{timeAgo(review.createdAt)}</span>
			</div>
			<div>
				<h3 className="font-bold">Comment</h3>
				<p className="border-2 border-dark-red p-1 rounded-md">
					{review.comment}
				</p>
			</div>
			{review.note && (<div>
				<h3 onClick={() => setNotesOpen(!notesOpen)} className="flex flex-row items-center gap-2 font-bold">
					{notesOpen ? (<ArrowDown className="size-4 stroke-3" />) : (<ArrowRight className="size-4 stroke-3" />)}
					Note
				</h3>
				<p className={`border-2 border-dark-red p-1 rounded-md ${notesOpen ? "visible" : "hidden"}`}>
					{review.note}
				</p>
			</div>)}


		</div >
	);
}
export default function ReviewHistory({ reviews }: { reviews: Review[] }) {
	const [open, setOpen] = useState(false)
	return (
		<div className="p-2 border-dark-red border-4 bg-egg-yellow rounded-2xl flex flex-col gap-2">

			<h3 onClick={() => setOpen(!open)} className="flex flex-row items-center gap-2 text-3xl">
				{open ? (<ArrowDown />) : (<ArrowRight />)}
				History
			</h3>


			{open && (
				reviews.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-center">
						<p className="text-zinc-600 text-xs">No previous reviews</p>
						<p className="text-zinc-700 text-[11px] mt-1">Be the first to review</p>
					</div>
				) : (
					<div className="gap-2 flex flex-col">
						{reviews.map((r) => (
							<TimelineEntry
								key={r.shipId}
								review={r}
							/>
						))}
					</div>
				)
			)}
		</div>
	)
}
