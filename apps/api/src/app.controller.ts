import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'passmint-api' };
  }
  @Get('health')
  health() {
    return { status: 'ok', service: 'passmint-api' };
  }
}
