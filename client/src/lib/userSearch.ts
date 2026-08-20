import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./debounce";
import { client } from "./api-client";
import { useErrors } from "./context/ErrorContext";

async function searchUsers(q: string, pushError: (v: string) => void) {
	if (q == "") {
		return { results: [], query: q }
	}
	const res = await client.api.users.search.$get({
		query: {
			q: q,
			limit: String(10)
		}
	})
	if (!res.ok) {
		const data = await res.json()
		pushError(data.message)
		throw new Error(data.message)
	}

	return await res.json();
}

export function useUserSearch(query: string) {
	const { pushError } = useErrors()
	const debouncedQuery = useDebounce(query, 300);

	return useQuery({
		queryKey: ["users", "search", debouncedQuery],
		queryFn: () => searchUsers(debouncedQuery, pushError),
		enabled: debouncedQuery.length >= 1,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});
}
