import type { EReasonCode } from './reasons';

export type TWeatherInput = Readonly<{
  cloudCoverPct: number | null; // 0..100
  humidityPct: number | null; // 0..100
  windSpeedKmh: number | null; // >=0
}>;

export type TObservingResult = Readonly<{
  observingScore: number; // 0..100 (главное)
  comfortScore: number; // 0..100 (бонус)
  reasons: ReadonlyArray<EReasonCode>;
}>;
