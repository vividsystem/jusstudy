import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import db from "./db";
import { accounts, sessions, users, verifications } from "./db/schema-auth";


interface AuthProfile {
	id: string,
	emailVerified: boolean,
	email: string,
	name: string,
	sub: string, // =id
	email_verified: string,
	family_name: string,
	nickname: string,
	updated_at: number, //in UNIX Seconds
	slack_id: string,
	verification_status: string,
	ysws_eligible: boolean,
}

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
					scopes: ["openid", "profile", "email", "name", "slack_id", "verification_status"],
					overrideUserInfo: true,
					mapProfileToUser: (p) => {
						const profile = p as AuthProfile


						return {
							id: profile.id,
							name: profile.name,
							email: profile.email,
							emailVerified: profile.emailVerified,
							image: undefined,
							yswsEligible: profile.ysws_eligible,
							verificationStatus: profile.verification_status,
							slackId: profile.slack_id
						}

					}
				}
			],
		})
	],
	user: {
		additionalFields: {
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
			}
		}
	}
})

