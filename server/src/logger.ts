import pino from "pino";
import { ENV } from "./lib/config";

const transport = pino.transport({
	targets: [
		{
			target: "pino-loki",
			options: {
				host: ENV.GRAFANA_LOKI_URL,
				labels: {
					app: "jus-study frontend",
					namespace: process.env.NODE_ENV || "development",
					runtime: `nodejs/${process.version}`
				}
			},
			...(process.env.NODE_ENV === "development" ? {
				target: "pino-pretty",
				options: { colorize: true },
			} : undefined),
		}
	]
})
export const logger = pino({
	level: ENV.LOG_LEVEL
},
	transport
);

