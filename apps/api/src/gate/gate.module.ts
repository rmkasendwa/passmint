import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module';
import { GateController } from './gate.controller';

@Module({
  imports: [TicketsModule],
  controllers: [GateController],
})
export class GateModule {}
