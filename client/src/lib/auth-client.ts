import { genericOAuthClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react"
import { serverURL } from "./urls";
import { typeValues } from "@server/db/schema-auth";


const SERVER_URL = serverURL("/api/auth").toString()
export const authClient = createAuthClient({
	baseURL: SERVER_URL,
	plugins: [
		genericOAuthClient(),
		inferAdditionalFields({
			user: {
				yswsEligible: {
					type: "boolean",
					required: true,
					input: false,
				},
				verificationStatus: {
					type: "string",
					required: true,
					input: false,
				},
				slackId: {
					type: "string",
					required: true,
					input: false,
					index: true
				},
				staff: {
					type: "boolean",
					required: true,
					defaultValue: false,
					input: false,
				},
				coins: {
					type: "number",
					required: true,
					defaultValue: 0,
					input: false
				},
				type: {
					type: [...typeValues],
					required: true,
					input: false,
				},
				banned: {
					type: "boolean",
					required: true,
					input: false
				},
			}
		})
	]
})
