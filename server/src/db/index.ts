import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@server/db/schema"

const db = drizzle(process.env.DATABASE_URL!, { schema });

export default db
