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

let errors: AppError[] = []

const listeners = new Set<() => void>()
let counter = 0

const emit = () => listeners.forEach((l) => l())

export const errorStore = {
	subscribe(listener: () => void) {
		listeners.add(listener)
		return () => listeners.delete(listener)
	},
	getSnapshot: () => errors
}
export function pushError(
	message: string,
	title = "Something went wrong",
	code: number | string | null = null,
	detail?: unknown,
): string {
	const id = `err-${++counter}-${Date.now()}`
	errors = [...errors, { id, title, message, code, detail, timestamp: new Date() }]
	emit()
	return id
}

export function dismissError(id: string) {
	errors = errors.filter((e) => e.id !== id)
	emit()
}

export function dismissAll() {
	errors = []
	emit()
}
