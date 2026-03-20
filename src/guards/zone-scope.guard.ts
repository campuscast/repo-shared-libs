import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/common.interfaces';

@Injectable()
export class ZoneScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    // Full-access roles bypass zone scoping
    if (user.roles?.includes('admin') || user.roles?.includes('super_admin')) {
      return true;
    }

    const zoneIds = this.extractZoneIds(request);
    if (zoneIds.length === 0) {
      return true; // No zone context required
    }

    const allowedZones = new Set((user.zone_ids || []).map(String));
    const forbiddenZoneId = zoneIds.find((zoneId) => !allowedZones.has(zoneId));

    if (forbiddenZoneId) {
      throw new ForbiddenException(`Access denied for zone ${forbiddenZoneId}`);
    }

    return true;
  }

  private extractZoneIds(request: Record<string, any>): string[] {
    const candidates = [
      request.params?.zoneId,
      request.query?.zone_id,
      request.query?.zone_ids,
      request.body?.zone_id,
      request.body?.zone_ids,
    ];

    return Array.from(new Set(
      candidates
        .flatMap((candidate) => {
          if (Array.isArray(candidate)) return candidate;
          if (typeof candidate === 'string' && candidate.includes(',')) {
            return candidate.split(',');
          }
          return candidate == null ? [] : [candidate];
        })
        .map((zoneId) => String(zoneId || '').trim())
        .filter(Boolean),
    ));
  }
}
