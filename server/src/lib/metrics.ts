import { metrics } from "@opentelemetry/api";
import db from "@server/db";
import { joeFraudReviews, projectShips } from "@server/db/schema";
import { logger } from "@server/logger";
import { and, count, eq, isNull } from "drizzle-orm";

const jusstudyMeter = metrics.getMeter("jusstudy")

export const fraudReviewFailures = jusstudyMeter.createCounter("jusstudy.external.fraud_review.failures", {
	description: "Failures to request a fraud review"
})

export const externalServiceFailures = jusstudyMeter.createCounter("jusstudy.external.failures", {
	description: "Failures to invoke external services"
})

export const staleShipGauge = jusstudyMeter.createObservableGauge("jusstudy.ships.stale", {
	description: "Ships that are stale because they are pre-fraud and a fraud review could not be requested"
})

staleShipGauge.addCallback(async (result) => {
	try {
		const [row] = await db
			.select({ n: count() })
			.from(projectShips)
			.leftJoin(joeFraudReviews, eq(joeFraudReviews.shipId, projectShips.id))
			.where(and(eq(projectShips.state, "pre-fraud"), isNull(joeFraudReviews.shipId)))
		result.observe(row?.n ?? 0)
	} catch (e) {
		logger.error({ err: e }, "stale ship gauge db query failed")
	}
})
