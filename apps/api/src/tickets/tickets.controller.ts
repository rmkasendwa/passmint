import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  create(@Body() dto: CreateTicketDto, @Req() request: AuthenticatedRequest) {
    return this.ticketsService.create(dto, request.user);
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.ticketsService.findMine(request.user!.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }
}
