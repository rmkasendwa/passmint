import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { TicketsService } from '../tickets/tickets.service';
import { ScanTicketDto } from './dto/scan-ticket.dto';

@Controller('gate')
export class GateController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('scan')
  @UseGuards(AuthGuard, AdminGuard)
  scan(@Body() dto: ScanTicketDto) {
    return this.ticketsService.scan(dto.code.trim());
  }
}
