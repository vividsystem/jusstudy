import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "./debounce";
import { client } from "./api-client";

async function searchUsers(q: string) {
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
		throw new Error(data.message)
	}

	return await res.json();
}

export function useUserSearch(query: string) {
	const debouncedQuery = useDebounce(query, 300);

	return useQuery({
		queryKey: ["users", "search", debouncedQuery],
		queryFn: () => searchUsers(debouncedQuery),
		enabled: debouncedQuery.length >= 1,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});
}
