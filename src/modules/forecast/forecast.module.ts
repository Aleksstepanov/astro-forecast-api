import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ForecastController } from './forecast.controller';
import { ForecastService } from './forecast.service';
import { OpenMeteoProvider } from './providers/open-meteo.provider';

@Module({
  imports: [HttpModule],
  controllers: [ForecastController],
  providers: [ForecastService, OpenMeteoProvider],
})
export class ForecastModule {}
