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

    // Extract zoneId from params, query, or body
    const zoneId =
      request.params?.zoneId ||
      request.query?.zone_id ||
      request.body?.zone_id;

    if (!zoneId) {
      return true; // No zone context required
    }

    if (!user.zone_ids?.includes(zoneId)) {
      throw new ForbiddenException(`Access denied for zone ${zoneId}`);
    }

    return true;
  }
}
