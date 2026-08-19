import { Navigate, useParams } from "react-router";
import { authClient } from "@client/lib/auth-client";
import Button from "@client/components/Button";
import { ArrowLeft } from "lucide-react";
import { client } from "@client/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { useErrors } from "@client/lib/context/ErrorContext";
import ReviewCard from "@client/components/reviews/ReviewCard";
import ReviewSubmissionForm from "@client/components/reviews/SubmissionForm";
import ReviewHistory from "@client/components/reviews/History";

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

			<div className="w-full grid grid-cols-2 p-4 gap-4">
				<div>
					<ReviewCard project={project} ship={ship} creator={creator} />
				</div>

				<div className="flex flex-col gap-4">
					<ReviewSubmissionForm shipId={ship.id} />

					<ReviewHistory reviews={reviews} />
				</div>
			</div>
		</div>
	);
}
