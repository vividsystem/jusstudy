import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import db from "./db";
import { accounts, sessions, users, verifications } from "./db/schema-auth";

//default redirectUri: /api/auth/oauth2/callback/hackclub-auth
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			verifications,
			users,
			sessions,
			accounts
		},
		usePlural: true
	}),
	trustedOrigins: [
		process.env.CORS_ORIGIN!,
	],
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: "hackclub-auth",
					clientId: process.env.HACKCLUB_AUTH_CLIENT_ID!,
					clientSecret: process.env.HACKCLUB_AUTH_CLIENT_SECRET!,
					discoveryUrl: "https://auth.hackclub.com/.well-known/openid-configuration",
					scopes: ["openid", "profile", "email", "name", "slack_id", "verification_status"]
				}
			]
		})
	]
})
