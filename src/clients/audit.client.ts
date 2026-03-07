import { Injectable, Logger } from '@nestjs/common';

export interface AuditEventPayload {
  event_type: string;
  actor_type: string;
  actor_id: string;
  zone_id?: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  detail?: Record<string, any>;
  correlation_id?: string;
  session_id?: string;
}

@Injectable()
export class AuditClient {
  private readonly logger = new Logger(AuditClient.name);
  private readonly baseUrl: string;
  private readonly maxAttempts: number;
  private readonly retryBaseMs: number;

  constructor() {
    const configuredAttempts = parseInt(process.env.AUDIT_APPEND_MAX_ATTEMPTS || '3', 10);
    const configuredRetryBaseMs = parseInt(process.env.AUDIT_APPEND_RETRY_BASE_MS || '200', 10);

    this.baseUrl = process.env.AUDIT_SERVICE_URL || 'http://audit-service:3009';
    this.maxAttempts = Number.isFinite(configuredAttempts) ? Math.max(1, configuredAttempts) : 3;
    this.retryBaseMs = Number.isFinite(configuredRetryBaseMs) ? Math.max(0, configuredRetryBaseMs) : 200;
  }

  private async backoff(attempt: number): Promise<void> {
    if (attempt >= this.maxAttempts) return;
    const delayMs = this.retryBaseMs * (2 ** (attempt - 1));
    if (delayMs <= 0) return;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  async append(event: AuditEventPayload): Promise<void> {
    let lastReason = 'unknown';

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}/audit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return;

        lastReason = `HTTP ${res.status}`;
        this.logger.warn(
          `Audit append failed (attempt ${attempt}/${this.maxAttempts}) event=${event.event_type} reason=${lastReason}`,
        );
      } catch (err) {
        lastReason = (err as Error).message;
        this.logger.warn(
          `Audit append error (attempt ${attempt}/${this.maxAttempts}) event=${event.event_type} reason=${lastReason}`,
        );
      }

      await this.backoff(attempt);
    }

    this.logger.warn(
      `Audit append dropped after ${this.maxAttempts} attempts event=${event.event_type} reason=${lastReason}`,
    );
  }
}
