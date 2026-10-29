import { queryOptions } from "@tanstack/react-query";
import { authClient } from "./auth-client";

export const sessionQuery = queryOptions({
	queryKey: ["session"],
	queryFn: async () => (await authClient.getSession()).data ?? null,
	staleTime: 60_000,
})
