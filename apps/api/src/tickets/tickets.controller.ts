import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { TicketActivityQueryDto } from "./dto/ticket-activity-query.dto";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { RecoverTicketsDto } from "./dto/recover-tickets.dto";
import { TicketsService } from "./tickets.service";

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  create(@Body() dto: CreateTicketDto, @Req() request: AuthenticatedRequest) {
    return this.ticketsService.create(dto, request.user);
  }

  @Get("mine")
  @UseGuards(AuthGuard)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.ticketsService.findMine(request.user!.id);
  }

  @Post("recovery")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  requestRecovery(@Body() dto: RecoverTicketsDto) {
    return this.ticketsService.requestRecovery(dto);
  }

  @Get("recovery/:token")
  @Header("Cache-Control", "no-store")
  redeemRecovery(@Param("token") token: string) {
    return this.ticketsService.redeemRecovery(token);
  }

  @Get("deliveries")
  @UseGuards(AuthGuard)
  @Header("Cache-Control", "no-store")
  deliveryAttempts(@Req() request: AuthenticatedRequest) {
    return this.ticketsService.deliveryAttempts(request.user!);
  }

  @Post("deliveries/:id/retry")
  @UseGuards(AuthGuard)
  @Header("Cache-Control", "no-store")
  retryDelivery(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.ticketsService.retryDelivery(id, request.user!);
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  findOne(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.ticketsService.findOne(id, request.user!);
  }

  @Get(":id/activity")
  @UseGuards(AuthGuard)
  @Header("Cache-Control", "no-store")
  activity(
    @Param("id") id: string,
    @Query() query: TicketActivityQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ticketsService.activity(id, request.user!, query.page);
  }
}
