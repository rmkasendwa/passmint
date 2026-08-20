import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { CreateEventDto } from "./dto/create-event.dto";
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

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.eventsService.findOne(id);
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
}
