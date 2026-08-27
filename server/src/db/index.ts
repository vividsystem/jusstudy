import 'dotenv/config';
import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import * as schema from "@server/db/schema"
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';


export type Transaction = PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>
const db = drizzle(process.env.DATABASE_URL!, { schema });

export default db
