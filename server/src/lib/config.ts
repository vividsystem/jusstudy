import 'dotenv/config';
import { z } from 'zod';

const logLevelSchema = z.literal(["fatal", "error", "warn", "info", "debug", "trace"])

const envSchema = z.object({
	BETTER_AUTH_SECRET: z.string().min(32),
	DATABASE_URL: z.url(),
	CORS_ORIGIN: z.url(),
	CLIENT_URL: z.url(),
	SERVER_URL: z.url(),
	START_DATE: z.coerce.date(),
	BOT_HOST: z.url(),
	BOT_ACCESS_TOKEN: z.string().nonempty(),
	JOE_EVENT_ID: z.string().nonempty(),
	JOE_API_KEY: z.string().nonempty(),
	HACKCLUB_AUTH_CLIENT_ID: z.string().nonempty(),
	HACKCLUB_AUTH_CLIENT_SECRET: z.string().nonempty(),
	HACKCLUB_CDN_API_KEY: z.string().nonempty(),
	HACKATIME_UID: z.string().nonempty(),
	HACKATIME_SECRET: z.string().nonempty(),
	LOG_LEVEL: logLevelSchema.default(process.env.NODE_ENV === "development" ? "debug" : "info"),
	OTEL_SERVICE_NAME: z.string().nonempty().optional().default("jusstudy-server"),
	OTEL_EXPORTER_OTLP_ENDPOINT: z.url(),
	OTEL_RESOURCE_ATTRIBUTES: z.string().nonempty().optional().default(process.env.NODE_ENV === "development" ? "deployment.environment.name=development" : "deployment.environment.name=production").transform((attrs) => Object.fromEntries(attrs.split(",").map(att => att.split("="))) as Record<string, string>)
});

type Env = z.infer<typeof envSchema>;

export const ENV: Env = envSchema.parse(process.env);
