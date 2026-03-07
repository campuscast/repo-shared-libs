import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { DeviceTokenPayload } from '../interfaces/common.interfaces';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, this.secret) as jwt.JwtPayload & DeviceTokenPayload;
      request.device = payload;
      return true;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Bearer token expired');
      }
      throw new UnauthorizedException('Invalid Bearer token');
    }
  }
}
