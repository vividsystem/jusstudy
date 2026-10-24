export function clientURL(path: string | URL) {
	const baseClientURL = import.meta.env.DEV ? "http://localhost:5173" : import.meta.env.VITE_CLIENT_URL!
	return new URL(path, baseClientURL)
}

export function serverURL(path: string | URL) {
	const baseServerURL = import.meta.env.DEV ? "http://localhost:3000" : import.meta.env.VITE_SERVER_URL!
	return new URL(path, baseServerURL)
}
