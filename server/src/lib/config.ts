import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
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
	GRAFANA_LOKI_URL: z.url(),
	LOG_LEVEL: z.literal(["fatal", "error", "warn", "info", "debug", "trace"]).default("info")
});

type Env = z.infer<typeof envSchema>;

export const ENV: Env = envSchema.parse(process.env);
