import type { devlogAttachments, devlogs, timeEntries } from "@server/db/schema";

interface Row {
	time_entries: typeof timeEntries.$inferSelect
	project_devlogs: typeof devlogs.$inferSelect
	devlog_attachments: typeof devlogAttachments.$inferSelect | null
}
export function mapAttachmentsToDevlogs(rows: Row[]) {
	type Devlog = Row["project_devlogs"];
	type Attachment = Omit<NonNullable<Row["devlog_attachments"]>, "devlogId">;

	type DevlogWithAttachments = Omit<Devlog, "timeEntryId"> & {
		timeLogged: number
		attachments: Attachment[];
	};
	const mapped = Object.values(
		rows.reduce<Record<string, DevlogWithAttachments>>((acc, row) => {
			const devlog = row.project_devlogs;
			if (!acc[devlog.id]) {
				if (row.devlog_attachments) {
					const { devlogId, ...attachment } = row.devlog_attachments; // name depends on your schema
					acc[devlog.id] = {
						...devlog,
						timeLogged: row.time_entries.duration,
						attachments: [attachment],
					};
				} else {
					acc[devlog.id] = {
						...devlog,
						timeLogged: row.time_entries.duration,
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

	return mapped
}
