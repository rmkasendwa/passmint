import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UploadEventImageDto } from './dto/upload-event-image.dto';
import { EventsService } from './events.service';
import { ImageStorageService } from './image-storage.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly imageStorage: ImageStorageService,
  ) {}

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post('uploads')
  @UseGuards(AuthGuard, AdminGuard)
  uploadImage(@Body() body: UploadEventImageDto) {
    return this.imageStorage.uploadImage(body);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }
}
