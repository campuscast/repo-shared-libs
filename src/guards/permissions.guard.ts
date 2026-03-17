import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'required_permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { roles?: string[]; permissions?: string[] };
    }>();
    const userPerms = request.user?.permissions || [];
    const userRoles = request.user?.roles || [];

    if (userPerms.includes('*')) return true;
    if (userRoles.includes('super_admin') || userRoles.includes('admin')) return true;

    const hasAll = required.every(p => userPerms.includes(p));
    if (!hasAll) {
      throw new ForbiddenException(`Missing required permissions: ${required.join(', ')}`);
    }

    return true;
  }
}
