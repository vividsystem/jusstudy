import { ErrorToastContainer } from "@client/components/ErrorToastContainer";
import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Context ──────────────────────────────────────────────────────────────────

const ErrorContext = createContext<ErrorContextValue | null>(null);

let _counter = 0;
const nextId = (): string => `err-${++_counter}-${Date.now()}`;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ErrorProvider({ children }: { children: ReactNode }) {
	const [errors, setErrors] = useState<AppError[]>([]);

	const pushError = useCallback(
		(
			message: string,
			title = "Something went wrong",
			code: number | string | null = null,
			detail?: unknown
		): string => {
			const id = nextId();
			setErrors((prev) => [
				...prev,
				{ id, title, message, code, detail, timestamp: new Date() },
			]);
			return id;
		},
		[]
	);

	const dismissError = useCallback((id: string) => {
		setErrors((prev) => prev.filter((e) => e.id !== id));
	}, []);

	const dismissAll = useCallback(() => setErrors([]), []);

	return (
		<ErrorContext.Provider value={{ errors, pushError, dismissError, dismissAll }}>
			{children}
			<ErrorToastContainer />
		</ErrorContext.Provider>
	);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useErrors(): ErrorContextValue {
	const ctx = useContext(ErrorContext);
	if (!ctx) throw new Error("useErrors() must be used inside <ErrorProvider>.");
	return ctx;
}
