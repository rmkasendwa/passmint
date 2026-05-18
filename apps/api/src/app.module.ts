import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { Event } from './events/event.entity';
import { EventsModule } from './events/events.module';
import { GateModule } from './gate/gate.module';
import { Ticket } from './tickets/ticket.entity';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [Event, Ticket],
        synchronize: true,
        ssl: false,
      }),
    }),
    EventsModule,
    TicketsModule,
    GateModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
