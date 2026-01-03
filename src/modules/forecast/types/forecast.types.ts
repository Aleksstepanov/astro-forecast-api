import type { EReasonCode } from '../../../core/observing';
import type { TLlmNarrative } from '../../llm/types/llm.types';

export type TForecastPeriod = 'day' | 'week' | 'month';

export type TForecastPoint = Readonly<{
  ts: string;
  cloud: number | null;
  humidity: number | null;
  wind: number | null;

  observingScore: number; // 0..100
  comfortScore: number; // 0..100
  reasons: ReadonlyArray<EReasonCode>;
}>;

export type TForecastResponse = Readonly<{
  meta: Readonly<{
    lat: number;
    lon: number;
    tz: string;
    period: TForecastPeriod;
    generatedAt: string;
    source: 'open-meteo';
  }>;
  timeseries: ReadonlyArray<TForecastPoint>;
  narrative: TLlmNarrative;
}>;
