// Health
export { HealthModule } from './health/health.module';

// Metrics
export { MetricsModule } from './metrics/metrics.module';

// Logger
export { LoggerModule, createLogger } from './logger/logger.module';

// Tracing
export { TracingModule, initTracing } from './tracing/tracing.module';

// Config
export { BaseConfigModule, envSchema } from './config/config.module';

// Redis
export { RedisModule, RedisService } from './redis/redis.module';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { ZoneScopeGuard } from './guards/zone-scope.guard';
export { DeviceAuthGuard } from './guards/device-auth.guard';

// Filters
export { AllExceptionsFilter } from './filters/all-exceptions.filter';

// Interceptors
export { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
export { LoggingInterceptor } from './interceptors/logging.interceptor';

// Interfaces
export * from './interfaces/common.interfaces';

// Clients
export { AuditClient } from './clients/audit.client';
export type { AuditEventPayload } from './clients/audit.client';

// Decorators
export { CorrelationId } from './decorators/correlation-id.decorator';
export { CurrentUser } from './decorators/current-user.decorator';
export { ZoneId } from './decorators/zone-id.decorator';
