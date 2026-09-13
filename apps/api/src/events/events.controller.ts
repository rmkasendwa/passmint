import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { CreateEventDto } from "./dto/create-event.dto";
import { AttendeeQueryDto } from "./dto/attendee-query.dto";
import { ScanMetricsQueryDto } from './dto/scan-metrics-query.dto';
import { DuplicateEventDto } from "./dto/duplicate-event.dto";
import { CancelEventDto } from "./dto/cancel-event.dto";
import { TicketTypeDto } from "./dto/ticket-type.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { UploadEventImageDto } from "./dto/upload-event-image.dto";
import { EventsService } from "./events.service";
import { ImageStorageService } from "./image-storage.service";

@Controller("events")
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly imageStorage: ImageStorageService,
  ) {}

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get("mine")
  @UseGuards(AuthGuard)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.eventsService.findMine(request.user!.id);
  }

  @Get("sales-summary")
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  salesSummary(@Req() request: AuthenticatedRequest) {
    return this.eventsService.salesSummary(request.user!);
  }

  @Get(":id/sales-summary")
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  eventSalesSummary(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.eventsService.salesSummary(request.user!, id);
  }

  @Get(':id/scan-metrics')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  scanMetrics(@Param('id') id: string, @Query() query: ScanMetricsQueryDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.scanMetrics(id, request.user!, query.day);
  }

  @Get(":id")
  @UseGuards(OptionalAuthGuard)
  findOne(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.eventsService.findOne(id, request.user);
  }

  @Post("uploads")
  @UseGuards(AuthGuard)
  uploadImage(@Body() body: UploadEventImageDto) {
    return this.imageStorage.uploadImage(body);
  }

  @Get(":id/attendees")
  @UseGuards(AuthGuard)
  attendees(@Param("id") id: string, @Query() query: AttendeeQueryDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.findAttendees(id, query, request.user!);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateEventDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.create(dto, request.user!);
  }

  @Post("drafts")
  @UseGuards(AuthGuard)
  createDraft(@Body() dto: UpdateEventDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.createDraft(dto, request.user!);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateEventDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.eventsService.update(id, dto, request.user!);
  }

  @Post(":id/cancel")
  @UseGuards(AuthGuard)
  cancel(@Param("id") id: string, @Body() dto: CancelEventDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.cancel(id, request.user!);
  }

  @Post(":id/duplicate")
  @UseGuards(AuthGuard)
  duplicate(@Param("id") id: string, @Body() dto: DuplicateEventDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.duplicate(id, dto.startsAt, request.user!);
  }

  @Post(":id/ticket-types")
  @UseGuards(AuthGuard)
  createTicketType(@Param("id") id: string, @Body() dto: TicketTypeDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.saveTicketType(id, dto, request.user!);
  }

  @Patch(":id/ticket-types/:typeId")
  @UseGuards(AuthGuard)
  updateTicketType(@Param("id") id: string, @Param("typeId") typeId: string, @Body() dto: TicketTypeDto, @Req() request: AuthenticatedRequest) {
    return this.eventsService.saveTicketType(id, dto, request.user!, typeId);
  }
}
