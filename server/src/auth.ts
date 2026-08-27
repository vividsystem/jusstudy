import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import db from "./db";
import { accounts, sessions, typeValues, users, userStats, verifications } from "./db/schema";
import { getSlackUserInformation } from "./lib/slack";


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

interface HackatimeProfile {
	id: number,
	emails: string[],
	slack_id: string,
	github_username: string
	trust_factor: TrustBlue | TrustRed | TrustYellow | TrustGreen
}


interface TrustBlue {
	trust_level: "blue"
	trust_value: 0
}

interface TrustRed {
	trust_level: "red"
	trust_value: 1
}

interface TrustYellow {
	trust_level: "yellow"
	trust_value: 3
}

interface TrustGreen {
	trust_level: "green"
	trust_value: 2
}


const CORS_ORIGIN = process.env.CORS_ORIGIN!
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
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await db.insert(userStats).values({ userId: user.id })
				}
			}
		}
	},
	trustedOrigins: [
		CORS_ORIGIN,
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
					mapProfileToUser: async (p) => {
						const profile = p as unknown as AuthProfile
						const userInf = await getSlackUserInformation(profile.slack_id)
						return {
							name: profile.name,
							email: profile.email,
							emailVerified: profile.emailVerified,
							image: userInf?.imageUrl,
							yswsEligible: profile.ysws_eligible,
							verificationStatus: profile.verification_status,
							slackId: profile.slack_id,
							nickname: userInf?.displayName || "no slack displayname :("
						}
					}
				},
				{
					providerId: "hackatime",
					clientId: process.env.HACKATIME_UID!,
					clientSecret: process.env.HACKATIME_SECRET!,
					authorizationUrl: "https://hackatime.hackclub.com/oauth/authorize",
					userInfoUrl: "https://hackatime.hackclub.com/api/v1/authenticated/me",
					tokenUrl: "https://hackatime.hackclub.com/oauth/token",
					scopes: ["profile", "read"],
					mapProfileToUser: async (p) => {
						const profile = p as unknown as HackatimeProfile
						// TODO map gh username
						// TODO find the correct email

						return {
							email: profile.emails[0],
						}

					},
					disableSignUp: true,
				}
			],
		}),
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
			},
			type: {
				type: [...typeValues],
				required: true,
				input: false,
			},
			coins: {
				type: "number",
				defaultValue: 0,
			},
			banned: {
				type: "boolean",
				required: true,
				input: false
			},
			nickname: {
				type: "string",
				required: true,
				input: false
			}
		},
		validateUserInfo: async ({ source }, ctx) => {
			if (source.oauth?.providerId === "hackclub-auth") return

			if (source.action === "sign-in") {
				return {
					error: "provider_not_allowed_for_signing",
					errorDescription: "This provider can not be used for sign-in"
				}
			} else if (source.action === "create-user") {
				return {
					error: "provider_not_allowed_for_signup",
					errorDescription: "This provider can not be used for sign-up"
				}
			}

			const accounts = await auth.api.listUserAccounts({
				headers: ctx.headers,
			});

			const hasPrimaryLinked = accounts?.some(
				(acc) => acc.providerId === "hackclub-auth"
			);

			if (!hasPrimaryLinked) {
				return {
					error: "primary_provider_required",
					errorDescription: `You must link hackclub-auth before linking this provider`,
				};
			}
		}
	},
	account: {
		accountLinking: {
			trustedProviders: ["hackatime"]
		}
	},
	telemetry: {
		enabled: false
	}
})
export type AuthType = typeof auth
