import {
	createContext,
	useContext,
} from "react";


export interface AppError {
	id: string;
	title: string;
	message: string;
	/** Optional HTTP status code or string error code, e.g. 404 or "ECONNREFUSED" */
	code?: number | string | null;
	/** Raw error object — shown in the collapsible "View error details" section */
	detail?: unknown;
	timestamp: Date;
}

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

export const ErrorContext = createContext<ErrorContextValue | null>(null);

export function useErrors(): ErrorContextValue {
	const ctx = useContext(ErrorContext);
	if (!ctx) throw new Error("useErrors() must be used inside <ErrorProvider>.");
	return ctx;
}
