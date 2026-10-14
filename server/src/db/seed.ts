import { logger } from "@server/logger";
import type { QueryObject } from ".";
import { shopRegions } from "./schema";

export default async function seed(db: QueryObject) {
	const regions = ["UK", "EU", "India", "Rest of the world", "MERCOSUR", "US", "Canada"]

	const res = await db
		.insert(shopRegions)
		.values(regions.map(r => ({ name: r })))
		.onConflictDoNothing({ target: shopRegions.name })
		.returning({ name: shopRegions.name })

	if (res.length != 0) {
		logger.info({ regions: res.map(r => r.name) }, "Seed shop regions")
	}
}
