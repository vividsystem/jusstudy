const SPACES_URL = process.env.SPACES_URL!;
const SPACES_ACC_CODE = process.env.SPACES_ACC_CODE!;
const SPACES_DEVLOG_ATT_SPACE_ID = process.env.SPACES_DEVLOG_ATT_SPACE_ID!;


interface SpaceFile {
	id: string
	space_id: string
	original_filename: string,
	file_size_bytes: number,
	mime_type?: string
	upload_date: string
	last_accessed: string
	download_count: number
	checksum: string
}

export async function uploadDevlogAttachmentToSpaces(files: File[]) {
	const form = new FormData();
	for (const file of files) {
		form.append("files[]", file);
	}
	for (const [key, value] of form.entries()) {
		console.log("FORM ENTRY: ", key, value)
	}

	const REQ_URL = `${SPACES_URL}/api/spaces/${SPACES_DEVLOG_ATT_SPACE_ID}/files?access_code=${SPACES_ACC_CODE}`
	const res = await fetch(REQ_URL, {
		method: "POST",
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
	console.log(data);
	return data as SpaceFile[] | { message: string, error_id: string };
}
