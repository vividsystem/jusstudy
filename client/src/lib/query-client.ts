import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { pushError } from "./errors";

export const queryClient = new QueryClient({
	defaultOptions: { queries: { staleTime: 30_000 } },
	queryCache: new QueryCache({
		onError: (err, query) => {
			if (query.meta?.silent) return
			pushError(err.message, "Load failed")
		},
	}),
	mutationCache: new MutationCache({
		onError: (err, _vars, _ctx, mutation) => {
			if (mutation.meta?.silent) return
			pushError(err.message, "Save failed")
		},
	}),
})
