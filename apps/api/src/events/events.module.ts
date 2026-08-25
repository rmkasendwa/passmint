import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { ImageStorageService } from "./image-storage.service";

@Module({
  imports: [AuthModule],
  controllers: [EventsController],
  providers: [EventsService, ImageStorageService],
  exports: [EventsService],
})
export class EventsModule {}
