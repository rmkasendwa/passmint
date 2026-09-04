import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { CreateEventDto } from "./dto/create-event.dto";
import { CancelEventDto } from "./dto/cancel-event.dto";
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
}
