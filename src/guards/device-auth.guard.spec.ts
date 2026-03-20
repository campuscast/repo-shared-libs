import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { DeviceAuthGuard } from './device-auth.guard';

function makeExecutionContext(token: string) {
  const request = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
}

function makeResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('DeviceAuthGuard', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.DEVICE_SERVICE_URL = 'http://device-service';
    process.env.INTERNAL_SERVICE_TOKEN = 'internal-token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  function signDeviceToken(payload: Record<string, unknown>) {
    return jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
  }

  it('authorizes active runtime-valid device', async () => {
    const token = signDeviceToken({
      sub: 'device-1',
      zone_id: 'zone-1',
      group_id: 'group-1',
      scopes: ['player:read'],
    });
    global.fetch = jest.fn().mockResolvedValue(
      makeResponse(200, {
        device_id: 'device-1',
        zone_id: 'zone-1',
        group_id: 'group-1',
        status: 'active',
      }),
    );

    const guard = new DeviceAuthGuard();
    await expect(guard.canActivate(makeExecutionContext(token))).resolves.toBe(true);
  });

  it('rejects missing runtime device with Unauthorized', async () => {
    const token = signDeviceToken({
      sub: 'device-1',
      zone_id: 'zone-1',
      group_id: 'group-1',
      scopes: ['player:read'],
    });
    global.fetch = jest.fn().mockResolvedValue(makeResponse(404, { message: 'not found' }));

    const guard = new DeviceAuthGuard();
    await expect(guard.canActivate(makeExecutionContext(token))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns ServiceUnavailable on runtime validation backend outage', async () => {
    const token = signDeviceToken({
      sub: 'device-1',
      zone_id: 'zone-1',
      group_id: 'group-1',
      scopes: ['player:read'],
    });
    global.fetch = jest.fn().mockResolvedValue(makeResponse(503, { message: 'down' }));

    const guard = new DeviceAuthGuard();
    await expect(guard.canActivate(makeExecutionContext(token))).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
