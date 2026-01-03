import { EReasonCode } from './reasons';
import type { TObservingResult, TWeatherInput } from './types';

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/**
 * Бонусный скоринг: "насколько приятно стоять".
 * v1: только ветер (позже добавим температуру/осадки).
 */
export const calcComfort = (
  input: TWeatherInput,
): Pick<TObservingResult, 'comfortScore' | 'reasons'> => {
  const reasons: EReasonCode[] = [];

  const wind = input.windSpeedKmh;

  if (wind === null) {
    reasons.push(EReasonCode.MISSING_WIND);
    return { comfortScore: 70, reasons };
  }

  const w = clamp(wind, 0, 120);

  // до 10 км/ч — почти идеально
  // 10..25 — терпимо
  // 25..45 — неприятно
  // 45+ — ад
  let penalty = 0;
  if (w <= 10) penalty = 0;
  else if (w <= 25)
    penalty = ((w - 10) / 15) * 0.25; // до 0.25
  else if (w <= 45)
    penalty = 0.25 + ((w - 25) / 20) * 0.45; // до 0.70
  else penalty = 0.7 + clamp((w - 45) / 40, 0, 1) * 0.3; // до 1.0

  if (w >= 30) reasons.push(EReasonCode.WINDY);

  const comfortScore = clamp(Math.round(100 * (1 - penalty)), 0, 100);
  return { comfortScore, reasons };
};
