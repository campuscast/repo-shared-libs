import { Module, Global } from '@nestjs/common';

/** Minimal env validation schema (services extend this) */
export const envSchema = {
  NODE_ENV: { default: 'development' },
  PORT: { default: '3000' },
  LOG_LEVEL: { default: 'info' },
  DATABASE_URL: { required: false },
  REDIS_URL: { default: 'redis://localhost:6379' },
  OTEL_EXPORTER_OTLP_ENDPOINT: { default: 'http://localhost:4317' },
  JWT_SECRET: { default: 'dev-secret-change-in-production' },
  JWT_EXPIRY: { default: '1h' },
};

@Global()
@Module({})
export class BaseConfigModule {}
