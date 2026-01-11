export function clientURL(path: string | URL) {
	const baseClientURL = import.meta.env.VITE_CLIENT_URL!
	return new URL(path, baseClientURL)
}

export function serverURL(path: string | URL) {
	const baseServerURL = clientURL("/api")
	return new URL(path, baseServerURL)
}
