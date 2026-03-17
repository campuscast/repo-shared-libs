export interface JwtPayload {
  sub: string;       // user_id
  email: string;
  roles: string[];
  permissions?: string[];
  zone_ids: string[];
  mfa_verified: boolean;
  iat: number;
  exp: number;
}

export interface DeviceTokenPayload {
  sub: string;       // device_id
  zone_id: string;
  group_id: string;
  scopes: string[];
  iat: number;
  exp: number;
}

export interface PaginationQuery {
  page: number;
  page_size: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface CausalMetadata {
  operation_id: string;
  client_id: string;
  lamport_ts: number;
  vector_clock: Record<string, number>;
  parent_op_id?: string;
  session_id: string;
}

export interface OperationSignature {
  signature: string; // base64
  key_id: string;
  algorithm: 'Ed25519' | 'HMAC-SHA256';
}

/** Metrics targets from ТЗ */
export const PERFORMANCE_TARGETS = {
  AUTO_MERGE_RATE: 0.99,                // 99% auto merges
  INVARIANT_VIOLATIONS: 0,              // zero tolerance
  CONVERGENCE_TIME_MS: 200,             // <200ms at RTT<200ms, loss<5%
  MAX_CLIENTS: 1000,                    // scale target
  LATENCY_GROWTH_PERCENT: 10,           // <10% at 1000 vs 100 clients
  AVG_SYNC_PAYLOAD_BYTES: 2048,         // <2KB per op
} as const;
