import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { accounts, accountsRelations, devlogs, devlogsRelations, hackatimeProjectLinks, hackatimeProjectLinksRelations, projects, projectsRelations, sessions, sessionsRelations, users, usersRelations, verifications } from './schema';

const db = drizzle(process.env.DATABASE_URL!, {
	schema: {
		projects,
		projectsRelations,
		hackatimeProjectLinks,
		hackatimeProjectLinksRelations,
		devlogs,
		devlogsRelations,
		users,
		sessions,
		accounts,
		verifications,
		usersRelations,
		sessionsRelations,
		accountsRelations
	}
});

export default db
