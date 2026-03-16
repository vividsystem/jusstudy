import { useState } from "react";
import { AlertCircle, ChevronRight, X } from "lucide-react";
import { useErrors, type AppError } from "@client/lib/context/ErrorContext";

// ─── Single Toast ─────────────────────────────────────────────────────────────

function ErrorToast({ error, onDismiss }: { error: AppError; onDismiss: (id: string) => void }) {
	const [expanded, setExpanded] = useState(false);

	const detailString: string | null = error.detail
		? JSON.stringify(error.detail, null, 2)
		: null;

	return (
		<div className="relative flex flex-col gap-2 rounded-xl border-4 border-egg-yellow bg-dark-red px-4 py-3 shadow-lg w-80">
			{/* Dismiss button */}
			<button
				onClick={() => onDismiss(error.id)}
				aria-label="Dismiss error"
				className="absolute top-2.5 right-3 text-egg-yellow/60 hover:text-egg-yellow transition-colors"
			>
				<X size={15} />
			</button>

			{/* Title row */}
			<div className="flex items-center gap-2 pr-5">
				<AlertCircle size={17} className="shrink-0 text-egg-yellow" />
				<span className="font-semibold text-sm text-egg-yellow leading-tight">
					{error.title}
				</span>
			</div>

			{/* Message */}
			<p className="text-xs text-egg-yellow/75 leading-relaxed pl-[1.5rem]">
				{error.code != null && (
					<span className="font-medium text-egg-yellow/90">
						Error {error.code}:{" "}
					</span>
				)}
				{error.message}
			</p>

			{/* Collapsible detail section */}
			{detailString && (
				<div className="pl-[1.5rem]">
					<button
						onClick={() => setExpanded((v) => !v)}
						className="flex items-center gap-1 text-xs text-egg-yellow/60 hover:text-egg-yellow/90 transition-colors"
					>
						<ChevronRight
							size={12}
							className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
						/>
						View error details
					</button>

					{expanded && (
						<pre className="mt-1.5 max-h-32 overflow-y-auto rounded-md border border-egg-yellow/20 bg-black/20 px-2.5 py-2 text-[10px] text-egg-yellow/60 leading-relaxed whitespace-pre-wrap break-all">
							{detailString}
						</pre>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Container ────────────────────────────────────────────────────────────────

export function ErrorToastContainer() {
	const { errors, dismissError, dismissAll } = useErrors();

	if (errors.length === 0) return null;

	return (
		<div
			role="alert"
			aria-live="assertive"
			className="fixed top-4 right-4 z-[9999] flex flex-col items-end gap-2"
		>
			{errors.length > 1 && (
				<button
					onClick={dismissAll}
					className="text-[10px] text-egg-yellow/50 hover:text-egg-yellow/80 transition-colors underline underline-offset-2 pr-1"
				>
					Dismiss all ({errors.length})
				</button>
			)}

			{[...errors].reverse().map((err) => (
				<ErrorToast key={err.id} error={err} onDismiss={dismissError} />
			))}
		</div>
	);
}
