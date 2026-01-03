import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ForecastService } from './forecast.service';
import { ForecastQueryDto } from './dto/forecast.query.dto';
import { ForecastResponseDto } from './dto/forecast.response.dto';

@ApiTags('forecast')
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get()
  @ApiOkResponse({
    description: 'Астропрогноз (погода + анализ)',
    type: ForecastResponseDto,
  })
  getForecast(@Query() query: ForecastQueryDto) {
    return this.forecastService.getForecast({
      lat: query.lat,
      lon: query.lon,
      tz: query.tz,
      period: query.period,
    });
  }
}
