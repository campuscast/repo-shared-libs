import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class MetricsController {
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics(): string {
    const service = process.env.OTEL_SERVICE_NAME || process.env.npm_package_name || 'campuscast-service';
    const uptime = process.uptime();
    const heapUsed = process.memoryUsage().heapUsed;
    return [
      '# HELP campuscast_service_up Service availability',
      '# TYPE campuscast_service_up gauge',
      `campuscast_service_up{service=\"${service}\"} 1`,
      '# HELP campuscast_process_uptime_seconds Process uptime in seconds',
      '# TYPE campuscast_process_uptime_seconds gauge',
      `campuscast_process_uptime_seconds{service=\"${service}\"} ${uptime.toFixed(2)}`,
      '# HELP campuscast_process_heap_bytes Process heap used bytes',
      '# TYPE campuscast_process_heap_bytes gauge',
      `campuscast_process_heap_bytes{service=\"${service}\"} ${heapUsed}`,
      '',
    ].join('\n');
  }
}
