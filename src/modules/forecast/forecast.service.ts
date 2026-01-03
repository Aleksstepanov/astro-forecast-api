import { Injectable } from '@nestjs/common';
import type {
  TForecastPeriod,
  TForecastResponse,
} from './types/forecast.types';
import { OpenMeteoProvider } from './providers/open-meteo.provider';
import { mapOpenMeteoToTimeseries } from './mappers/map-open-meteo-to-forecast';

@Injectable()
export class ForecastService {
  constructor(private readonly openMeteo: OpenMeteoProvider) {}

  private periodToDays(period: TForecastPeriod): number {
    if (period === 'day') return 1;
    if (period === 'week') return 7;
    return 30; // month (MVP)
  }

  async getForecast(args: {
    lat: number;
    lon: number;
    tz: string;
    period: TForecastPeriod;
  }): Promise<TForecastResponse> {
    const days = this.periodToDays(args.period);

    const raw = await this.openMeteo.fetchForecast({
      lat: args.lat,
      lon: args.lon,
      tz: args.tz,
      days,
    });

    return {
      meta: {
        lat: args.lat,
        lon: args.lon,
        tz: args.tz,
        period: args.period,
        generatedAt: new Date().toISOString(),
        source: 'open-meteo',
      },
      timeseries: mapOpenMeteoToTimeseries(raw),
    };
  }
}
