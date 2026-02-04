import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { accounts, accountsRelations, addresses, addressesRelations, devlogs, devlogsRelations, hackatimeProjectLinks, hackatimeProjectLinksRelations, projects, projectsRelations, sessions, sessionsRelations, shopItemRelations, shopItems, shopOrders, users, usersRelations, verifications } from './schema';

const db = drizzle(process.env.DATABASE_URL!, {
	schema: {
		projects,
		projectsRelations,
		hackatimeProjectLinks,
		hackatimeProjectLinksRelations,
		devlogs,
		devlogsRelations,
		shopItems,
		shopItemRelations,
		shopOrders,
		addresses,
		addressesRelations,
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
