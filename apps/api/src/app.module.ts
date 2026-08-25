import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { GateModule } from './gate/gate.module';
import { PrismaModule } from './prisma/prisma.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(__dirname, '../../../.env')],
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    EventsModule,
    TicketsModule,
    GateModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
