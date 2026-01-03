import { DateTime } from 'luxon';

import type { TForecastPoint } from '../types/forecast.types';
import type { TOpenMeteoResponse } from '../types/open-meteo.types';

import {
  calcComfort,
  calcObserving,
  type TWeatherInput,
  type EReasonCode,
} from '../../../core/observing';

const pick = (arr: number[] | undefined, i: number): number | null => {
  if (!arr) return null;

  const v = arr[i];
  return Number.isFinite(v) ? v : null;
};

const uniq = <T>(arr: ReadonlyArray<T>): T[] => Array.from(new Set(arr));

const toIsoWithOffset = (unixSec: number, tz: string): string => {
  // unixSec от Open-Meteo приходит как seconds since epoch (UTC)
  const iso = DateTime.fromSeconds(unixSec, { zone: 'utc' })
    .setZone(tz)
    .toISO({ suppressMilliseconds: true });

  // Luxon теоретически может вернуть null (если tz невалидный),
  // но у нас tz приходит из Open-Meteo и валидируется на входе,
  // так что это страховка.
  return iso ?? new Date(unixSec * 1000).toISOString();
};

export const mapOpenMeteoToTimeseries = (
  src: TOpenMeteoResponse,
): TForecastPoint[] => {
  const time = src.hourly.time ?? [];
  const tz = src.timezone;

  return time.map((unixSec, i) => {
    const cloud = pick(src.hourly.cloud_cover, i);
    const humidity = pick(src.hourly.relative_humidity_2m, i);
    const wind = pick(src.hourly.wind_speed_10m, i);

    const input: TWeatherInput = {
      cloudCoverPct: cloud,
      humidityPct: humidity,
      windSpeedKmh: wind,
    };

    const obs = calcObserving(input);
    const comf = calcComfort(input);

    const reasons = uniq<EReasonCode>([...obs.reasons, ...comf.reasons]);

    return {
      ts: toIsoWithOffset(unixSec, tz),
      cloud,
      humidity,
      wind,
      observingScore: obs.observingScore,
      comfortScore: comf.comfortScore,
      reasons,
    };
  });
};
