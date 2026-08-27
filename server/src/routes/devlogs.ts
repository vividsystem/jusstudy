import { zValidator } from "@hono/zod-validator";
import db from "@server/db";
import { devlogAttachments, devlogs, projects, timeEntries, timeHackatimeLinks } from "@server/db/schema";
import { singleProjectTime } from "@server/hackatime/client";
import { NewDevlogRequestSchema } from "@shared/validation/devlogs";
import { and, desc, eq, getTableColumns, sum } from "drizzle-orm";
import { Hono } from "hono";
import type { Env } from "..";
import { uploadDevlogAttachmentToCDN, validImageAttachments } from "@server/lib/cdn";
import { bodyLimit } from "hono/body-limit";
import { MAX_FILE_SIZE } from "@shared/vars";
import z from "zod";
import { auth } from "@server/auth";
import { mapAttachmentsToDevlogs } from "@server/lib/devlogs";


export const devlogsRoute = new Hono<Env>()
	.post("/:id/attachment", bodyLimit({
		maxSize: MAX_FILE_SIZE,
		onError: (c) => {
			return c.json({ message: "File too large" }, 413)
		}
	}),
		zValidator(
			"form",
			z.object({
				images: z.union([z.instanceof(File), z.array(z.instanceof(File))]),
			})
		),
		async (c) => {
			const user = c.get("user");
			if (!user) return c.json({ message: "Unauthorized" }, 401)
			const id = c.req.param("id")

			const [devlog] = await db
				.select({
					d: getTableColumns(devlogs),
					ownerId: projects.creatorId
				})
				.from(devlogs)
				.innerJoin(projects, eq(projects.id, devlogs.projectId))
				.where(eq(devlogs.id, id))
			if (!devlog) {
				return c.json({ message: "Not found" }, 404)
			} else if (devlog.ownerId != user.id) {
				return c.json({ message: "Forbidden" }, 403)
			}

			const { images } = c.req.valid("form")

			const files = Array.isArray(images) ? images : [images]

			if (!validImageAttachments(files)) {
				return c.json({ message: "Invalid file types" }, 400)
			}

			const res = await uploadDevlogAttachmentToCDN(files)

			await db.insert(devlogAttachments).values(res.map((sf) => ({
				cdnURL: sf.url,
				devlogId: devlog.d.id
			})))

			return c.json({ message: "Attachments uploaded successfully" }, 201)
		})


export const projectDevlogsRoute = new Hono<Env>()
	.post("/", zValidator("json", NewDevlogRequestSchema), async (c) => {
		const user = c.get("user")
		const logger = c.get("logger")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const projectId = c.req.param("id")
		if (!projectId) {
			return c.json({ message: "Bad request" }, 400)
		}
		const data = c.req.valid("json")


		const [project] = await db.select().from(projects).where(eq(projects.id, projectId))
		if (!project) {
			return c.json({ message: "Not found" }, 404)
		}
		if (project.creatorId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}

		const [lastEntry] = await db
			.select()
			.from(timeEntries)
			.where(eq(projects.id, project.id))
			.orderBy(desc(timeEntries.createdAt))
			.limit(1)




		const links = await db
			.select({ name: timeHackatimeLinks.hackatimeProjectName })
			.from(timeHackatimeLinks)
			.where(eq(timeHackatimeLinks.projectId, projectId))


		const accounts = await auth.api.listUserAccounts({ headers: c.req.raw.headers })
		const htAccount = accounts.find((a) => a.providerId === "hackatime")
		if (!htAccount) {
			return c.json({ message: "Hackatime account needs to be linked!" }, 400)
		}
		const token = await auth.api.getAccessToken({
			headers: c.req.raw.headers,
			body: {
				accountId: htAccount.id
			}
		})
		const stats = await singleProjectTime(token.accessToken, links.map((l) => l.name))
		if (!stats.ok) {
			logger.error({ project, data, links }, stats.error)
			return c.json({ message: "Hackatime fetching went wrong" }, 500)
		}

		const offsetTime = lastEntry?.timeAnchor || 0
		if (stats.data <= offsetTime) {
			return c.json({ message: "No time that could be logged" }, 400)
		}

		const duration = (stats.data - offsetTime)

		const [entry] = await db.insert(timeEntries).values({
			projectId: project.id,
			createdBy: user.id,
			duration,
			timeAnchor: stats.data,
			type: "devlog"
		}).returning()
		if (!entry) {
			logger.error({ project, data, links, stats, entry }, "Coudnt insert time entry for devlog")
			return c.json({ message: "Something went wrong" }, 500)
		}

		const [devlog] = await db.insert(devlogs).values({
			...data,
			timeEntryId: entry.id,
			projectId: projectId,
		}).returning()
		if (!devlog) {
			logger.error({ project, data, links, entry, devlog }, "Couldnt insert devlog")
			return c.json({ message: "Something went wrong" }, 500)
		}

		await db
			.update(projects)
			.set({
				totalTime: sum(timeEntries.duration)
			})
			.from(timeEntries)
			.where(and(
				eq(projects.id, project.id),
				eq(timeEntries.projectId, project.id)
			))


		return c.json({ devlog: devlog }, 201)
	})
	.get("/", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const projectId = c.req.param("id")
		if (!projectId) {
			return c.json({ message: "Bad request" }, 400)
		}

		const res = await db
			.select()
			.from(devlogs)
			.where(eq(devlogs.projectId, projectId))
			.innerJoin(timeEntries, eq(devlogs.timeEntryId, timeEntries.id))
			.leftJoin(devlogAttachments, eq(devlogs.id, devlogAttachments.devlogId))
			.orderBy(desc(devlogs.createdAt))


		const mapped = mapAttachmentsToDevlogs(res)

		return c.json({
			devlogs: mapped
		}, 200)

	})
