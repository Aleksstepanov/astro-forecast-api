import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { TOpenMeteoResponse } from '../types/open-meteo.types';

@Injectable()
export class OpenMeteoProvider {
  constructor(private readonly http: HttpService) {}

  fetchForecast = async (args: {
    lat: number;
    lon: number;
    tz: string;
    days: number;
  }): Promise<TOpenMeteoResponse> => {
    const { lat, lon, tz, days } = args;

    const hourly = [
      'cloud_cover',
      'cloud_cover_low',
      'cloud_cover_mid',
      'cloud_cover_high',
      'relative_humidity_2m',
      'wind_speed_10m',
    ].join(',');

    const url = 'https://api.open-meteo.com/v1/forecast';

    const resp = await firstValueFrom(
      this.http.get<TOpenMeteoResponse>(url, {
        params: {
          latitude: lat,
          longitude: lon,
          hourly,
          forecast_days: days,
          timezone: tz,
          timeformat: 'unixtime',
        },
      }),
    );

    return resp.data;
  };
}
