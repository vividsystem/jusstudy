export function clientURL(path: string | URL) {
	const baseClientURL = import.meta.env.VITE_CLIENT_URL!
	return new URL(path, baseClientURL)
}

export function serverURL(path: string | URL) {
	const baseServerURL = import.meta.env.VITE_SERVER_URL!
	return new URL(path, baseServerURL)
}
