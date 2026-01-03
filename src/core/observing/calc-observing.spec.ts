import { EReasonCode } from './reasons';
import { calcObserving } from './calc-observing';

describe('calcObserving', () => {
  it('should return 100 score for ideal conditions', () => {
    const result = calcObserving({
      cloudCoverPct: 0,
      humidityPct: 0,
      windSpeedKmh: 0,
    });
    expect(result.observingScore).toBe(100);
    expect(result.reasons).toEqual([]);
  });

  it('should return 18 score for extreme cloudy conditions', () => {
    const result = calcObserving({
      cloudCoverPct: 100,
      humidityPct: 0,
      windSpeedKmh: 0,
    });
    // cloudPenalty = (100/100)^1.35 = 1
    // humidityPenalty = 0 (as h=0 < 75)
    // totalPenalty = 1 * 0.82 + 0 * 0.18 = 0.82
    // score = round(100 * (1 - 0.82)) = 18
    expect(result.observingScore).toBe(18);
    expect(result.reasons).toContain(EReasonCode.CLOUDY_EXTREME);
  });

  it('should handle null cloud cover with a penalty', () => {
    const result = calcObserving({
      cloudCoverPct: null,
      humidityPct: 0,
      windSpeedKmh: 0,
    });
    // cloudPenalty for null is 0.55
    // totalPenalty = 0.55 * 0.82 + 0 * 0.18 = 0.451
    // score = round(100 * (1 - 0.451)) = round(54.9) = 55
    expect(result.observingScore).toBe(55);
    expect(result.reasons).toContain(EReasonCode.MISSING_CLOUD);
  });

  it('should handle null humidity with a penalty', () => {
    const result = calcObserving({
      cloudCoverPct: 0,
      humidityPct: null,
      windSpeedKmh: 0,
    });
    // humidityPenalty for null is 0.15
    // totalPenalty = 0 * 0.82 + 0.15 * 0.18 = 0.027
    // score = round(100 * (1 - 0.027)) = round(97.3) = 97
    expect(result.observingScore).toBe(97);
    expect(result.reasons).toContain(EReasonCode.MISSING_HUMIDITY);
  });

  it('should add CLOUDY_HIGH reason for cloud >= 80', () => {
    const result = calcObserving({
      cloudCoverPct: 85,
      humidityPct: 50,
      windSpeedKmh: 0,
    });
    expect(result.reasons).toContain(EReasonCode.CLOUDY_HIGH);
  });

  it('should add CLOUDY_MID reason for cloud >= 60', () => {
    const result = calcObserving({
      cloudCoverPct: 65,
      humidityPct: 50,
      windSpeedKmh: 0,
    });
    expect(result.reasons).toContain(EReasonCode.CLOUDY_MID);
  });

  it('should add HUMID_HIGH reason for humidity >= 90', () => {
    const result = calcObserving({
      cloudCoverPct: 0,
      humidityPct: 95,
      windSpeedKmh: 0,
    });
    expect(result.reasons).toContain(EReasonCode.HUMID_HIGH);
  });

  it('should add HUMID_MID reason for humidity >= 80', () => {
    const result = calcObserving({
      cloudCoverPct: 0,
      humidityPct: 85,
      windSpeedKmh: 0,
    });
    expect(result.reasons).toContain(EReasonCode.HUMID_MID);
  });

  it('should clamp values and return 18 score for cloud >= 100', () => {
    const result = calcObserving({
      cloudCoverPct: 150,
      humidityPct: -50,
      windSpeedKmh: 0,
    });
    // cloud 150 -> 100 penalty (1.0)
    // humidity -50 -> 0 penalty (0.0)
    // totalPenalty = 1 * 0.82 + 0 * 0.18 = 0.82
    // score = 18
    expect(result.observingScore).toBe(18);
  });
});
