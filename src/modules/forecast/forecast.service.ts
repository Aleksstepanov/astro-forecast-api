import { Injectable } from '@nestjs/common';

import { OpenMeteoProvider } from './providers/open-meteo.provider';
import { mapOpenMeteoToTimeseries } from './mappers/map-open-meteo-to-forecast';

import type {
  TForecastPeriod,
  TForecastResponse,
} from './types/forecast.types';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class ForecastService {
  constructor(
    private readonly openMeteo: OpenMeteoProvider,
    private readonly llm: LlmService,
  ) {}

  private periodToDays = (period: TForecastPeriod): number => {
    if (period === 'day') return 1;
    if (period === 'week') return 7;
    return 30;
  };

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

    const timeseries = mapOpenMeteoToTimeseries(raw);

    // Топ часов по observingScore (для текста)
    const topHours = [...timeseries]
      .sort((a, b) => b.observingScore - a.observingScore)
      .slice(0, 8)
      .map((x) => ({
        ts: x.ts,
        observingScore: x.observingScore,
        reasons: x.reasons.map(String),
      }));

    const avg =
      timeseries.length === 0
        ? 0
        : Math.round(
            timeseries.reduce((s, x) => s + x.observingScore, 0) /
              timeseries.length,
          );

    const max = timeseries.reduce((m, x) => Math.max(m, x.observingScore), 0);

    // Короткая сводка — чтобы LLM не плавал
    const summary = `Средний observingScore: ${avg}/100. Лучший час: ${max}/100.`;

    const narrative = await this.llm.generateNarrative({
      tz: args.tz,
      period: args.period,
      summary,
      topHours,
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
      timeseries,
      narrative,
    };
  }
}
