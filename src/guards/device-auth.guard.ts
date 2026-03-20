import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { DeviceTokenPayload } from '../interfaces/common.interfaces';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  private readonly secret: string;
  private readonly deviceServiceUrl: string;
  private readonly internalServiceToken: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    this.deviceServiceUrl = process.env.DEVICE_SERVICE_URL || 'http://localhost:3003';
    this.internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN || '';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, this.secret) as jwt.JwtPayload & DeviceTokenPayload;
      const deviceId = typeof payload.sub === 'string' ? payload.sub : '';
      if (!deviceId) {
        throw new UnauthorizedException('Invalid Bearer token');
      }

      const runtimeRes = await fetch(
        `${this.deviceServiceUrl}/devices/${encodeURIComponent(deviceId)}/runtime`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            ...(this.internalServiceToken ? { 'x-internal-token': this.internalServiceToken } : {}),
          },
          signal: AbortSignal.timeout(4000),
        },
      );

      if (runtimeRes.status === 404 || runtimeRes.status === 401 || runtimeRes.status === 403) {
        throw new UnauthorizedException('Device is not valid');
      }

      if (!runtimeRes.ok) {
        throw new ServiceUnavailableException('Device validation service unavailable');
      }

      const runtimeDevice = await runtimeRes.json() as {
        device_id?: string;
        zone_id?: string;
        group_id?: string;
        status?: string;
      };

      if (
        runtimeDevice.device_id !== deviceId
        || runtimeDevice.status !== 'active'
        || runtimeDevice.zone_id !== payload.zone_id
        || runtimeDevice.group_id !== payload.group_id
      ) {
        throw new UnauthorizedException('Device session is no longer valid');
      }

      request.device = payload;
      return true;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Bearer token expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid Bearer token');
      }
      if (err instanceof UnauthorizedException || err instanceof ServiceUnavailableException) {
        throw err;
      }
      throw new ServiceUnavailableException('Device validation service unavailable');
    }
  }
}
