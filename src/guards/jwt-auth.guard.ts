import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from '../interfaces/common.interfaces';

const ACCESS_TOKEN_COOKIE = 'cc_access_token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    return secret || 'dev-secret-change-in-production';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = jwt.verify(token, this.getSecret()) as jwt.JwtPayload & JwtPayload;
      request.user = payload;
      return true;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: any): string | null {
    // 1. Authorization header (primary)
    const authHeader = request.headers?.['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // 2. Cookie fallback (for httpOnly cookie auth)
    const cookies = request.cookies;
    if (cookies?.[ACCESS_TOKEN_COOKIE]) {
      return cookies[ACCESS_TOKEN_COOKIE];
    }

    // 3. Parse from raw cookie header if cookie-parser not installed
    const cookieHeader = request.headers?.['cookie'];
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|; )${ACCESS_TOKEN_COOKIE}=([^;]*)`));
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    return null;
  }
}
