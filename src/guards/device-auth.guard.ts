import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { DeviceTokenPayload } from '../interfaces/common.interfaces';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Device ')) {
      throw new UnauthorizedException('Missing Device token');
    }

    const token = authHeader.slice(7);
    try {
      // Stub: in production verify device JWT with device JWKS endpoint
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid device token format');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as DeviceTokenPayload;

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedException('Device token expired');
      }

      request.device = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid device token');
    }
  }
}
