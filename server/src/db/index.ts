import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@server/db/schema"

const db = drizzle<typeof schema>(process.env.DATABASE_URL!);

export default db
