import { zValidator } from "@hono/zod-validator";
import db from "@server/db";
import { devlogAttachments, devlogs, hackatimeProjectLinks, projects } from "@server/db/schema";
import { singleProjectTime } from "@server/hackatime/client";
import { NewDevlogRequestSchema } from "@shared/validation/devlogs";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { Hono } from "hono";
import type { Env } from "..";
import { uploadDevlogAttachmentToCDN } from "@server/lib/cdn";
import { bodyLimit } from "hono/body-limit";
import { MAX_FILE_SIZE } from "@shared/vars";
import z from "zod";


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

			const files = Array.isArray(images)
				? images : [images]


			const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
			const invalid = files.find((f) => !ALLOWED_TYPES.includes(f.type))
			if (invalid) {
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


		const project = await db.select().from(projects).where(eq(projects.id, projectId!))
		if (project.length == 0) {
			return c.json({ message: "Not found" }, 404)
		}
		if (project[0]?.creatorId != user.id) {
			return c.json({ message: "Forbidden" }, 403)
		}


		const offsetTimeRes = await db
			.select({ totalTime: devlogs.totalTimeSpent })
			.from(devlogs)
			.where(eq(devlogs.projectId, projectId))
			.orderBy(desc(devlogs.totalTimeSpent))
			.limit(1)
		const offsetTime = offsetTimeRes[0]?.totalTime || 0

		const links = await db.select().from(hackatimeProjectLinks).where(eq(hackatimeProjectLinks.projectId, projectId))

		const stats = await singleProjectTime(user.slackId, links)
		if (!stats.ok) {
			logger.error({ project, data, links }, stats.error)
			return c.json({ message: "Hackatime fetching went wrong" }, 500)
		}

		if (stats.time <= offsetTime) {
			return c.json({ message: "No time that could be logged" }, 400)
		}

		const diffTotalTime = (stats.time - offsetTime)



		const res = await db.insert(devlogs).values({
			...data,
			projectId: projectId,
			totalTimeSpent: stats.time,
			timeSpent: diffTotalTime < 10 * 3600 ? diffTotalTime : 10 * 3600, // constrain time per log to 10h
		}).returning()
		if (res.length == 0) {
			logger.error({ project, data, links, res }, "Couldnt insert devlog")
			return c.json({ message: "Something went wrong" }, 500)
		}

		return c.json({ devlog: res[0]! }, 201)
	})
	.get("/", async (c) => {
		const user = c.get("user")
		if (!user) return c.json({ message: "Unauthorized" }, 401)

		const projectId = c.req.param("id")
		if (!projectId) {
			return c.json({ message: "Bad request" }, 400)
		}

		const res = await db.select().from(devlogs).where(eq(devlogs.projectId, projectId)).leftJoin(devlogAttachments, eq(devlogs.id, devlogAttachments.devlogId)).orderBy(desc(devlogs.createdAt))
		type Row = typeof res[number];

		type Devlog = Row["project_devlogs"];
		type Attachment = Omit<NonNullable<Row["devlog_attachments"]>, "devlogId">;

		type DevlogWithAttachments = Devlog & {
			attachments: Attachment[];
		};
		const mapped = Object.values(
			res.reduce<Record<string, DevlogWithAttachments>>((acc, row) => {
				const devlog = row.project_devlogs;
				if (!acc[devlog.id]) {
					if (row.devlog_attachments) {
						const { devlogId, ...attachment } = row.devlog_attachments; // name depends on your schema
						acc[devlog.id] = {
							...devlog,
							attachments: [attachment],
						};
					} else {
						acc[devlog.id] = {
							...devlog,
							attachments: [],
						};
					}
				} else {
					if (row.devlog_attachments) {
						const { devlogId, ...attachment } = row.devlog_attachments; // name depends on your schema
						acc[devlog.id]!.attachments.push(attachment);
					}
				}
				return acc;
			}, {})
		);


		return c.json({
			devlogs: mapped
		}, 200)

	})
// TODO: get all devlogs of project
// TOOD: get one
