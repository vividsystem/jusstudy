import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react"
import { clientURL } from "./urls";


const SERVER_URL = clientURL("/api/auth").toString()
export const authClient = createAuthClient({
	baseURL: SERVER_URL,
	plugins: [
		genericOAuthClient()
	]
})
