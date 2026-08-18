import { secondsToFormatTime, timeAgo } from "@client/lib/time";
import { BookOpen, GitPullRequest, Globe, MoveRight } from "lucide-react";
import type { InferResponseType } from "hono";
import type { client } from "@client/lib/api-client";
import Button from "@client/components/Button"
import Link from "@client/components/Link"
import { Avatar } from "@client/components/UserIcon"
import { ProjectCateogryBadge, ShipStateBadge, BadgeSkeleton } from "./Badges";



type ShipResponse = InferResponseType<typeof client.api.ships[":id"]["$get"]>
type Ship = Extract<ShipResponse, { ship: unknown }>["ship"]
type ProjectResponse = InferResponseType<typeof client.api.projects[":id"]["$get"]>
type Project = Extract<ProjectResponse, { project: unknown }>["project"]
type UserResponse = InferResponseType<typeof client.api.users[":id"]["$get"]>
type User = Extract<UserResponse, { user: unknown }>["user"]


interface TimeStatProps {
	seconds: number
	label: string
}
function TimeStat(props: TimeStatProps) {

	return (
		<div className="flex flex-col items-center justify-center border-2 px-8 py-2 rounded-md w-1/2">
			<span className="text-xl font-bold">{secondsToFormatTime(props.seconds)}</span>
			<span className="text-md">{props.label}</span>
		</div>
	)
}


function TimeStatSkeleton({ label }: { label: string }) {
	return (
		<div className="flex flex-col items-center justify-center border-2 rounded-md w-1/2 gap-2 py-2 animate-pulse">
			<div className="h-6 w-24 bg-dark-red rounded-md" />
			<span className="text-md">{label}</span>
		</div>
	)
}

interface ReviewProjectCardProps {
	ship: Ship
	project: Project
	creator: User
}
export default function ReviewCard({ ship, project, creator }: ReviewProjectCardProps) {
	return (
		<div className="border-dark-red bg-egg-yellow border-4 p-4 rounded-2xl w-fit flex flex-col gap-1 text-light-brown">
			<div className="flex gap-2">
				<h2 className="text-dark-red text-3xl font-bold">{project.name}</h2>
				<ShipStateBadge status={"pre-fraud"} />
				<ProjectCateogryBadge category={project.category} />
			</div>
			<div className="flex gap-2 items-center text-xl">
				<span>by</span>
				<Link href="/users" external={false} className="group grup-has-[*:nth-child(2)]:gap-2">
					<Avatar imageURL={creator.image} size={8} hideMissing />
					<span className="hover:text-dark-red transition-colors">{creator.nickname}</span>
				</Link>
			</div>
			<div className="flex flex-row gap-2 w-full">
				<TimeStat label="shipped" seconds={ship.loggedTime} />
				<TimeStat label="total" seconds={ship.totalTime} />
			</div>
			{project.description && (
				<div>
					<h3 className="font-bold">Description</h3>
					<p>{project.description}</p>
				</div>
			)}
			<div className="flex gap-2">
				{project.demoLink ? (
					<Button
						className="w-full gap-2 rounded-xl border-2 hover:bg-dark-red hover:text-egg-yellow"
						href={project.demoLink}
					>
						<Globe />
						<span>Demo</span>
					</Button>
				) : (
					<p className="w-full rounded-xl border-2 bg-dark-red text-egg-yellow flex items-center text-center">
						Mising Demo!
					</p>
				)}
				{project.repository ? (

					<Button
						className="w-full gap-2 rounded-xl border-2 hover:bg-dark-red hover:text-egg-yellow"
						href={project.repository}
					>
						<GitPullRequest />
						<span>Repo</span>
					</Button>
				) : (
					<p className="w-full rounded-xl border-2 bg-dark-red text-egg-yellow flex items-center text-center">
						Mising Repo!
					</p>

				)}
				{project.readmeLink ? (

					<Button
						className="w-full gap-2 rounded-xl border-2 hover:bg-dark-red hover:text-egg-yellow"
						href={project.readmeLink}
					>
						<BookOpen />
						<span>ReadMe</span>
					</Button>
				) : (
					<p className="w-full rounded-xl border-2 bg-dark-red text-egg-yellow flex items-center text-center">
						Mising ReadMe!
					</p>
				)}
			</div>
		</div>
	)
}

export function PreviewReviewCard({ ship, project }: Omit<ReviewProjectCardProps, "creator">) {
	return (
		<div className="border-dark-red bg-egg-yellow border-4 p-4 rounded-2xl w-fit flex flex-col gap-1 text-light-brown justify-between">
			<div className="flex flex-col gap-1">
				<div className="flex gap-2">
					<div>
						<h2 className="text-dark-red text-3xl font-bold">{project.name}</h2>
						<p>shipped <span className="font-bold">{timeAgo(ship.createdAt)}</span></p>
					</div>
					<ShipStateBadge status={ship.state} />
					<ProjectCateogryBadge category={project.category} />
				</div>
				<div className="flex gap-2">
				</div>
				<div className="flex flex-row gap-2 w-full">
					<TimeStat label="shipped" seconds={ship.loggedTime} />
					<TimeStat label="total" seconds={ship.totalTime} />
				</div>
				{project.description && (
					<div>
						<h3 className="font-bold">Description</h3>
						<p>{project.description}</p>
					</div>
				)}
			</div>
			<Button
				className="w-full rounded-xl border-2"
				href={`/reviews/${ship.id}`}
			>Start Review <MoveRight /> </Button>
		</div>
	)
}

export function CardSkeleton() {
	return (<div>
		<div className="border-dark-red bg-egg-yellow border-4 p-4 rounded-2xl w-fit flex flex-col gap-1 text-light-brown justify-between animate-pulse">
			<div className="flex flex-col gap-1">
				<div className="flex gap-2">
					<div className="h-8 w-36 rounded-md bg-dark-red animation-pulse" />
					<BadgeSkeleton />
					<BadgeSkeleton />
				</div>
				<div className="flex gap-2">
					<div className="h-6 w-28 rounded-md bg-dark-red animate-pulse" />
				</div>
				<div className="flex flex-row gap-2">
					<TimeStatSkeleton label="shipped" />
					<TimeStatSkeleton label="total" />
				</div>
				<div>
					<h3 className="font-bold">Description</h3>
					<div className="flex flex-col gap-1">
						<div className="h-5 w-full bg-dark-red rounded-md animate-pulse" />
						<div className="h-5 w-full bg-dark-red rounded-md animate-pulse" />
						<div className="h-5 w-5/8 bg-dark-red rounded-md animate-pulse" />
					</div>
				</div>
			</div>
			<Button
				className="w-full rounded-xl border-2"
			>Start Review <MoveRight /> </Button>
		</div>
	</div>)
}
