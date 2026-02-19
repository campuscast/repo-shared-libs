import { Module, Global, LoggerService } from '@nestjs/common';
import pino from 'pino';

export function createLogger(serviceName: string): LoggerService {
  const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    base: { service: serviceName },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  return {
    log(message: string, ...args: any[]) { logger.info({ args }, message); },
    error(message: string, ...args: any[]) { logger.error({ args }, message); },
    warn(message: string, ...args: any[]) { logger.warn({ args }, message); },
    debug(message: string, ...args: any[]) { logger.debug({ args }, message); },
    verbose(message: string, ...args: any[]) { logger.trace({ args }, message); },
  };
}

@Global()
@Module({})
export class LoggerModule {}
