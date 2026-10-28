import { externalTracer, withSpan } from "."
import { ENV } from "./config"
import { SpanKind, SpanStatusCode } from "@opentelemetry/api"

const HACKCLUB_CDN_URL = "https://cdn.hackclub.com"

interface CDNFile {
	id: string
	filename: string,
	size: number,
	content_type: string
	url: string
	created_at: string
}

export function validImageFormats(files: File[]) {
	const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
	return !files.some((f) => !ALLOWED_TYPES.includes(f.type))
}

const uploadSingleFile = async (file: File, spanName: string) => {
	return withSpan(externalTracer, SpanKind.CLIENT, spanName, async (span) => {
		const form = new FormData();
		form.append("file", file);

		const REQ_URL = `${HACKCLUB_CDN_URL}/api/v4/upload`
		const res = await fetch(REQ_URL, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${ENV.HACKCLUB_CDN_API_KEY}`
			},
			body: form,
		});

		span.setAttributes({ "peer.service": "cdn", "http.response.status_code": res.status })
		if (!res.ok) {
			const err = res.headers.get("Content-Type")?.includes("application/json") ? await res.json() : await res.text();
			span.setAttributes({
				"request.file.type": file.type,
				"request.file.name": file.name,
				"response.err": JSON.stringify(err)
			})
			span.setStatus({ code: SpanStatusCode.ERROR })

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
		span.setStatus({ code: SpanStatusCode.OK })
		return data as CDNFile
	})
}


export async function uploadDevlogAttachmentToCDN(files: File[]) {
	return withSpan(externalTracer, SpanKind.CLIENT, "cdn.upload_devlog_attachment", async (span) => {
		let responses: CDNFile[] = [];
		for (const file of files) {


			const form = new FormData();
			form.append("file", file);

			const REQ_URL = `${HACKCLUB_CDN_URL}/api/v4/upload`
			const res = await fetch(REQ_URL, {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${ENV.HACKCLUB_CDN_API_KEY}`
				},
				body: form,
			});

			span.setAttributes({ "peer.service": "cdn", "http.response.status_code": res.status })
			if (!res.ok) {
				const err = res.headers.get("Content-Type")?.includes("application/json") ? await res.json() : await res.text();
				span.setAttributes({
					"request.file.type": file.type,
					"request.file.name": file.name,
					"response.err": JSON.stringify(err)
				})
				span.setStatus({ code: SpanStatusCode.ERROR })

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
		span.setStatus({ code: SpanStatusCode.OK })
		return responses
	})
}

export const uploadProjectBannerToCDN = async (file: File) => {
	return uploadSingleFile(file, "cdn.upload_project_banner")
}

export const uploadItemIcon = async (file: File) => {
	return uploadSingleFile(file, "cdn.upload_item_icon")
}
