import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: ['./src/db/schema/*'],
	dialect: 'postgresql',
	verbose: true,
	strict: true,
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
