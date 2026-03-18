import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ZoneScopeGuard } from '../src/guards/zone-scope.guard';

describe('ZoneScopeGuard', () => {
  const guard = new ZoneScopeGuard();

  function createContext(request: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('allows super_admin role across zones', () => {
    const context = createContext({
      user: { roles: ['super_admin'], zone_ids: [] },
      query: { zone_id: 'zone-b' },
      params: {},
      body: {},
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows assigned operator zone', () => {
    const context = createContext({
      user: { roles: ['operator'], zone_ids: ['zone-a'] },
      query: { zone_id: 'zone-a' },
      params: {},
      body: {},
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies unassigned operator zone', () => {
    const context = createContext({
      user: { roles: ['operator'], zone_ids: ['zone-a'] },
      query: { zone_id: 'zone-b' },
      params: {},
      body: {},
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
