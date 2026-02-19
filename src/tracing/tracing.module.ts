import { Module, Global } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

let sdk: NodeSDK | undefined;

export function initTracing(serviceName: string): void {
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';
  const metricsPort = parseInt(process.env.METRICS_PORT || '9464', 10);

  sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({ url: otlpEndpoint }),
    metricReader: new PrometheusExporter({ port: metricsPort }),
    instrumentations: [
      new HttpInstrumentation(),
      new NestInstrumentation(),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => sdk?.shutdown());
}

@Global()
@Module({})
export class TracingModule {}
