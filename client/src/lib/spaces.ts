export function getSpaceFileURL(fileId: string) {
	return `${import.meta.env.VITE_SPACES_URL}/api/files/${fileId}/download`
}
