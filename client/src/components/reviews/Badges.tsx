import type { ProjectCategories, ProjectShipStatus } from "@server/db/schema";

const CATEGORY_META: Record<ProjectCategories, { label: string, className: string }> = {
	"Web Development": { label: "Web", className: "bg-sky-400 text-sky-700 border-sky-700" },
	"App Development": { label: "App", className: "bg-violet-400 text-violet-700 border-violet-700" },
	"Desktop App Development": { label: "Desktop", className: "bg-indigo-400 text-indigo-700 border-indigo-700" },
	"Game Development": { label: "Game", className: "bg-emerald-400 text-emerald-700 border-emerald-700" },
	"PCB Design": { label: "PCB", className: "bg-yellow-400 text-yellow-700 border-yellow-700" },
	"CAD": { label: "CAD", className: "bg-teal-400 text-teal-700 border-teal-700" },
};

const STATE_META: Record<ProjectShipStatus, { label: string; className: string }> = {
	"voting": { label: "Voting", className: "border-emerald-400 text-emerald-400 bg-emerald-400" },
	"pre-initial": { label: "Initial", className: "border-zinc-700 text-zinc-700 bg-zinc-400" },
	"pre-fraud": { label: "Fraud", className: "border-amber-700 text-amber-700 bg-amber-400" },
	"failed": { label: "Failed", className: "border-red-700 text-red-700 bg-red-400" },
	"finished": { label: "Finished", className: "border-blue-700 text-blue-700 bg-blue-400" },
	"pre-payout": { label: "Pre-Payout", className: "border-gray-700 text-gray-700 bg-gray-400" }
};

export function ShipStateBadge(props: { status: ProjectShipStatus }) {
	return (<span className={`${STATE_META[props.status].className} px-2 py-1 rounded-2xl border-2 h-fit`}>
		{STATE_META[props.status].label}
	</span >)
}


export function ProjectCateogryBadge(props: { category: ProjectCategories }) {
	return (<span className={`${CATEGORY_META[props.category].className} px-2 py-1 rounded-2xl border-2 h-fit`}>
		{CATEGORY_META[props.category].label}
	</span>)
}

export function BadgeSkeleton() {
	return <div className="rounded-2xl h-8 w-12 bg-dark-red animate-pulse" />

}
