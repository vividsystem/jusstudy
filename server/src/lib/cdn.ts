const HACKCLUB_CDN_URL = "https://cdn.hackclub.com"
const CDN_API_KEY = process.env.HACKCLUB_CDN_API_KEY!

interface CDNFile {
	id: string
	filename: string,
	size: number,
	content_type: string
	url: string
	created_at: string
}

export function validImageAttachments(files: File[]) {
	const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
	return !files.some((f) => !ALLOWED_TYPES.includes(f.type))
}


export async function uploadDevlogAttachmentToCDN(files: File[]) {
	let responses: CDNFile[] = [];
	for (let file of files) {

		const form = new FormData();
		form.append("file", file);

		const REQ_URL = `${HACKCLUB_CDN_URL}/api/v4/upload`
		const res = await fetch(REQ_URL, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${CDN_API_KEY}`
			},
			body: form,
		});

		if (!res.ok) {
			const err = res.headers.get("Content-Type")?.includes("application/json") ? await res.json() : await res.text();

			throw new Error(JSON.stringify({
				message: "Devlog attachment upload failed",
				res: {
					status: res.status,
					body: err,
					headers: res.headers
				}
			}));
		}
		const data = await res.json();
		responses.push(data as CDNFile)

	}

	return responses
}
