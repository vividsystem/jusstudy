import z from "zod";

export const adminStatsSchema = z.object({
	payoutsGiven: z.number(),
	shipsMade: z.number(),
	minPayout: z.number(),
	maxPayout: z.number(),
	avgPayout: z.number(),
	finishedShips: z.number(),
	failedShips: z.number(),
	shipsInVoting: z.number(),
	shipsAwaitingNormalReview: z.number(),
	shipsAwaitingFraudReview: z.number(),
	shipsAwaitingPayout: z.number(),
})
