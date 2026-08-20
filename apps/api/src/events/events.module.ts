import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { User } from "../users/user.entity";
import { Event } from "./event.entity";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { ImageStorageService } from "./image-storage.service";

@Module({
  imports: [TypeOrmModule.forFeature([Event, User]), AuthModule],
  controllers: [EventsController],
  providers: [EventsService, ImageStorageService],
  exports: [EventsService],
})
export class EventsModule {}
