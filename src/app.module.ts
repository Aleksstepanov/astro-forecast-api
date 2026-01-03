import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { LocationsModule } from './modules/locations/locations.module';
import { ForecastModule } from './modules/forecast/forecast.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'astro_forecast'),
        autoLoadEntities: true,
        synchronize: false, // ВАЖНО: не включаем авто-синк в проде. На старте тоже лучше без него.
      }),
    }),
    LocationsModule,
    ForecastModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
