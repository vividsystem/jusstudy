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
