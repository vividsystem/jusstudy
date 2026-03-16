export function uniqueEntriesEqual<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) return false;
	const set = new Set(a);
	return b.every(x => set.has(x));
}
