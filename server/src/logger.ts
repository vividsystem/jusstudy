import pino from "pino";
import { ENV } from "./lib/config";
import { trace } from "@opentelemetry/api";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

const transport = pino.transport({
	targets: [
		{
			target: "pino-opentelemetry-transport",
			options: {
				resourceAttributes: {
					[ATTR_SERVICE_NAME]: ENV.OTEL_SERVICE_NAME,
					...ENV.OTEL_RESOURCE_ATTRIBUTES
				}
			}
		},
		...(process.env.NODE_ENV === "development" ? [{
			target: "pino-pretty"
		}] : [{
			target: "pino/file",
			options: { destination: 1 }
		}]),
	]
})
export const logger = pino({
	level: ENV.LOG_LEVEL,
	mixin: () => {
		const spanCtx = trace.getActiveSpan()?.spanContext()
		if (!spanCtx) return {}
		return { trace_id: spanCtx.traceId, span_id: spanCtx.spanId, trace_flags: spanCtx.traceFlags }
	}
},
	transport
);

