import { NodeSDK } from "@opentelemetry/sdk-node"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto"
import { ENV } from "./lib/config"

export const metricReader = new PeriodicExportingMetricReader({
	exporter: new OTLPMetricExporter({
		url:
			new URL("/v1/metrics", ENV.OTEL_EXPORTER_OTLP_ENDPOINT).toString()
	}),
})

export const resource = defaultResource().merge(resourceFromAttributes(ENV.OTEL_RESOURCE_ATTRIBUTES))

const otelSDK = new NodeSDK({
	instrumentations: [],
	serviceName: ENV.OTEL_SERVICE_NAME,
	traceExporter: new OTLPTraceExporter({
		url: new URL("/v1/traces", ENV.OTEL_EXPORTER_OTLP_ENDPOINT).toString()
	}),
	metricReader,
	resource
})

otelSDK.start()
process.once("SIGTERM", () => otelSDK.shutdown().finally(() => process.exit(0)))

export { otelSDK }
