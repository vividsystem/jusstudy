import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import * as schema from "@server/db/schema"
import type { PgDatabase, PgTransaction } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { ENV } from "@server/lib/config";


export type Transaction = PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>
export type QueryObject = PgDatabase<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>
const db = drizzle(ENV.DATABASE_URL, { schema });

export default db
