import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ZoneId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.params?.zoneId || request.query?.zone_id || request.body?.zone_id;
  },
);
