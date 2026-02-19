import { Module, Global, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  /** Acquire distributed lock with TTL */
  async acquireLock(key: string, token: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, token, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /** Release distributed lock (only if token matches) */
  async releaseLock(key: string, token: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, key, token);
    return result === 1;
  }

  /** Idempotency check: returns true if operation_id already seen */
  async checkIdempotency(operationId: string, windowSeconds: number): Promise<boolean> {
    const key = `idemp:${operationId}`;
    const exists = await this.client.exists(key);
    if (exists) return true;
    await this.client.set(key, '1', 'EX', windowSeconds);
    return false;
  }

  /** Rate limiting: sliding window counter */
  async checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowKey = `rl:${key}`;
    const pipeline = this.client.pipeline();
    pipeline.zremrangebyscore(windowKey, 0, now - windowSeconds * 1000);
    pipeline.zadd(windowKey, now.toString(), `${now}`);
    pipeline.zcard(windowKey);
    pipeline.expire(windowKey, windowSeconds);
    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) || 0;
    return { allowed: count <= maxRequests, remaining: Math.max(0, maxRequests - count) };
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
