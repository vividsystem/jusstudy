import { SpanKind, SpanStatusCode, trace, type Span, type Tracer } from "@opentelemetry/api"
import type { Logger } from "pino"

export type HelperCfg = {
	logger?: Logger
}

export const externalTracer = trace.getTracer("external")

export function withSpan<T>(
	tracer: Tracer,
	kind: SpanKind,
	name: string,
	fn: (span: Span) => Promise<T>,
): Promise<T> {
	return tracer.startActiveSpan(name, { kind }, (span) =>
		fn(span)
			.catch((err) => {
				span.recordException(err as Error)
				span.setStatus({
					code: SpanStatusCode.ERROR
				})

				throw err
			})
			.finally(() => span.end())
	)
}
