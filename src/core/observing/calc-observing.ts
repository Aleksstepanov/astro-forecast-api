import { EReasonCode } from './reasons';
import type { TObservingResult, TWeatherInput } from './types';

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/**
 * Главный скоринг: "насколько есть шанс увидеть звёзды" (погода-часть).
 *
 * v1:
 *  - облачность (главный фактор, нелинейный штраф)
 *  - влажность (эвристика риска дымки/тумана)
 *
 * Ветер сюда НЕ включаем — это отдельный comfortScore.
 */
export const calcObserving = (
  input: TWeatherInput,
): Pick<TObservingResult, 'observingScore' | 'reasons'> => {
  const reasons: EReasonCode[] = [];

  const cloud = input.cloudCoverPct;
  const humidity = input.humidityPct;

  // --- Cloud penalty (0..1)
  // Нелинейный штраф: высокие значения облачности портят сильнее.
  // cloud=0   -> 0
  // cloud=50  -> ~0.39
  // cloud=80  -> ~0.74
  // cloud=100 -> 1
  const cloudPenalty =
    cloud === null
      ? 0.55 // неизвестно — считаем "рискованно"
      : Math.pow(clamp(cloud, 0, 100) / 100, 1.35);

  if (cloud === null) {
    reasons.push(EReasonCode.MISSING_CLOUD);
  } else if (cloud >= 95) {
    reasons.push(EReasonCode.CLOUDY_EXTREME);
  } else if (cloud >= 80) {
    reasons.push(EReasonCode.CLOUDY_HIGH);
  } else if (cloud >= 60) {
    reasons.push(EReasonCode.CLOUDY_MID);
  }

  // --- Humidity penalty (0..1)
  // До 75% почти не штрафуем. Выше — растёт риск дымки/тумана.
  let humidityPenalty = 0;

  if (humidity === null) {
    humidityPenalty = 0.15;
    reasons.push(EReasonCode.MISSING_HUMIDITY);
  } else {
    const h = clamp(humidity, 0, 100);

    if (h >= 90) reasons.push(EReasonCode.HUMID_HIGH);
    else if (h >= 80) reasons.push(EReasonCode.HUMID_MID);

    // нормируем диапазон 75..100 -> 0..1 и слегка делаем нелинейным
    const t = clamp((h - 75) / 25, 0, 1);
    humidityPenalty = Math.pow(t, 1.2);
  }

  // Веса: облачность рулит
  const totalPenalty = clamp(
    cloudPenalty * 0.82 + humidityPenalty * 0.18,
    0,
    1,
  );

  const observingScore = clamp(Math.round(100 * (1 - totalPenalty)), 0, 100);

  return { observingScore, reasons };
};
