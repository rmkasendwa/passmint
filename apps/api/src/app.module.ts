import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { Event } from './events/event.entity';
import { EventsModule } from './events/events.module';
import { GateModule } from './gate/gate.module';
import { Ticket } from './tickets/ticket.entity';
import { TicketsModule } from './tickets/tickets.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(__dirname, '../../../.env')],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const postgresUser = config.get<string>('POSTGRES_USER') ?? 'passmint';
        const postgresPassword =
          config.get<string>('POSTGRES_PASSWORD') ?? 'passmint';
        const postgresHost = config.get<string>('POSTGRES_HOST') ?? 'localhost';
        const postgresPort = config.get<string>('POSTGRES_PORT') ?? '5432';
        const postgresDb = config.get<string>('POSTGRES_DB') ?? 'passmint';

        return {
          type: 'postgres',
          url:
            config.get<string>('DATABASE_URL') ??
            `postgres://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}`,
          entities: [Event, Ticket, User],
          synchronize: true,
          ssl: false,
        };
      },
    }),
    AuthModule,
    EventsModule,
    TicketsModule,
    GateModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
