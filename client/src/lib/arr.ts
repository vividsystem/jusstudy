type StateArraySetter<T extends Array<object>> = (value: React.SetStateAction<T>) => void


export const changeStateArray = <L extends Exclude<keyof U, K>, K extends keyof U, U extends object>(
	setter: StateArraySetter<Array<U>>,
	idField: K,
	id: U[K],
	field: L,
	value: U[L]
) => {
	setter(items =>
		items.map(item =>
			item[idField] === id
				? { ...item, [field]: value }
				: item
		))
}
