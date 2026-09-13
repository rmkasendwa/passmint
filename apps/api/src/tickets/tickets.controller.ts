import { Body, Controller, Get, Header, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TicketActivityQueryDto } from './dto/ticket-activity-query.dto';
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
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.ticketsService.findOne(id, request.user!);
  }

  @Get(':id/activity')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  activity(@Param('id') id: string, @Query() query: TicketActivityQueryDto, @Req() request: AuthenticatedRequest) {
    return this.ticketsService.activity(id, request.user!, query.page);
  }
}
