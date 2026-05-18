import { Body, Controller, Post } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service';
import { ScanTicketDto } from './dto/scan-ticket.dto';

@Controller('gate')
export class GateController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('scan')
  scan(@Body() dto: ScanTicketDto) {
    return this.ticketsService.scan(dto.code.trim());
  }
}
