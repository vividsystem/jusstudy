// half of theoretical max
export const STAR_BUDGET = 40
export const SIGMA_TRESHOLD = 2.5; // about 15 rounds depending on consistency
const TECHNICALITY_WEIGHT = 1
const DOCUMENTATION_WEIGHT = 1
const CREATIVITY_WEIGHT = 1
const IMPLEMENTATION_WEIGHT = 1


export function balanceCategories(technicality: number, documentation: number, creativity: number, implementation: number) {
	return (
		technicality * TECHNICALITY_WEIGHT +
		documentation * DOCUMENTATION_WEIGHT +
		creativity * CREATIVITY_WEIGHT +
		implementation * IMPLEMENTATION_WEIGHT
	) / (TECHNICALITY_WEIGHT + DOCUMENTATION_WEIGHT + CREATIVITY_WEIGHT + IMPLEMENTATION_WEIGHT)
}

// "walk the line"
export function weightedSample<T extends { sigma: number }>(
	candidates: T[],
	n: number
): T[] {
	const pool = [...candidates];
	const selected: T[] = [];

	for (let i = 0; i < n && pool.length > 0; i++) {
		const totalWeight = pool.reduce((sum, c) => sum + c.sigma, 0);

		let rand = Math.random() * totalWeight;

		for (let j = 0; j < pool.length; j++) {
			rand -= pool[j]!.sigma;
			if (rand <= 0) {
				selected.push(pool[j]!);
				pool.splice(j, 1);
				break;
			}
		}
	}

	return selected;
}



export function calculatePayout(ordinal: number, reviewBphBoost: number, timeLoggedInSeconds: number) {
	const timeLeftAfterFirst10h = Math.max(timeLoggedInSeconds - 10 * 3600, 0) // in s
	const timeFirst10h = Math.min(10 * 3600, Math.max(timeLoggedInSeconds, 0)) // in s

	return (
		(multiplierPerHour(ordinal) + reviewBphBoost) * timeLeftAfterFirst10h
		+ first10hMultiplierPerHour(ordinal) * timeFirst10h
	) / 3600 // per hour instead of per s
}

const MAX_PAYOUT = 1.3; // in books
const MIN_PAYOUT = 0.7;
const MAX_SCORE = 50;
const MIN_SCORE = SIGMA_TRESHOLD * -3;

export function multiplierPerHour(ordinal: number) {
	return (MAX_PAYOUT - MIN_PAYOUT) / (MAX_SCORE - MIN_SCORE) * (ordinal - MIN_SCORE) + MIN_PAYOUT
}

const MAX_PAYOUT_F = 1.0; // in books; for first 10h
export function first10hMultiplierPerHour(ordinal: number) {
	return (MAX_PAYOUT_F - MIN_PAYOUT) / (MAX_SCORE - MIN_SCORE) * (ordinal - MIN_SCORE) + MIN_PAYOUT
}
