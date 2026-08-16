import { useCallback, useState, type ReactNode } from "react";
import { ErrorContext, type AppError } from "./ErrorContext";
import { ErrorToastContainer } from "@client/components/ErrorToastContainer";

let _counter = 0;
const nextId = (): string => `err-${++_counter}-${Date.now()}`;

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
