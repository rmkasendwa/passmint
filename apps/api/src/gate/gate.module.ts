import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TicketsModule } from '../tickets/tickets.module';
import { GateController } from './gate.controller';

@Module({
  imports: [TicketsModule, AuthModule],
  controllers: [GateController],
})
export class GateModule {}
