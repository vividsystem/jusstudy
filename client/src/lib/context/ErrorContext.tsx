import { useSyncExternalStore } from "react";
import { errorStore, pushError, dismissError, dismissAll, type AppError } from "../errors";

export interface ErrorContextValue {
	errors: AppError[];
	/**
	 * Push an error into the toast queue.
	 * Returns the generated id so callers can dismiss it programmatically.
	 *
	 * @example
	 * // From a query onError callback:
	 * pushError(err.message, "Load failed", err.response?.status, err);
	 *
	 * // Without throwing — after a non-ok response:
	 * if (!res.ok) pushError(await res.text(), "Save failed", res.status);
	 */
	pushError: (
		message: string,
		title?: string,
		code?: number | string | null,
		detail?: unknown
	) => string;
	dismissError: (id: string) => void;
	dismissAll: () => void;
}

export function useErrors(): ErrorContextValue {
	const errors = useSyncExternalStore(errorStore.subscribe, errorStore.getSnapshot, errorStore.getServerSnapshot)
	return { errors, pushError, dismissError, dismissAll }
}
