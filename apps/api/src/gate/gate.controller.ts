import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { TicketsService } from "../tickets/tickets.service";
import { ScanTicketDto } from "./dto/scan-ticket.dto";

@Controller("gate")
export class GateController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post("scan")
  @UseGuards(AuthGuard)
  scan(@Body() dto: ScanTicketDto, @Req() request: AuthenticatedRequest) {
    return this.ticketsService.scan(dto.code.trim(), request.user!);
  }
}
