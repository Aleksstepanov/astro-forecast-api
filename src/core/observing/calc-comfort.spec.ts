import { EReasonCode } from './reasons';
import { calcComfort } from './calc-comfort';

describe('calcComfort', () => {
  it('should return 100 score for low wind speed', () => {
    const result = calcComfort({
      cloudCoverPct: 0,
      humidityPct: 0,
      windSpeedKmh: 5,
    });
    expect(result.comfortScore).toBe(100);
    expect(result.reasons).toEqual([]);
  });

  it('should return 70 score and MISSING_WIND reason for null wind speed', () => {
    const result = calcComfort({
      cloudCoverPct: 0,
      humidityPct: 0,
      windSpeedKmh: null,
    });
    expect(result.comfortScore).toBe(70);
    expect(result.reasons).toContain(EReasonCode.MISSING_WIND);
  });

  it('should calculate penalty correctly for moderate wind (10-25 km/h)', () => {
    // 25 km/h -> penalty = ((25-10)/15) * 0.25 = 0.25
    // score = 100 * (1 - 0.25) = 75
    const result = calcComfort({
      cloudCoverPct: 0,
      humidityPct: 0,
      windSpeedKmh: 25,
    });
    expect(result.comfortScore).toBe(75);
    expect(result.reasons).not.toContain(EReasonCode.WINDY);
  });

  it('should calculate penalty correctly for unpleasant wind (25-45 km/h)', () => {
    // 45 km/h -> penalty = 0.25 + ((45-25)/20) * 0.45 = 0.25 + 0.45 = 0.70
    // score = 100 * (1 - 0.70) = 30
    const result = calcComfort({
      cloudCoverPct: 0,
      humidityPct: 0,
      windSpeedKmh: 45,
    });
    expect(result.comfortScore).toBe(30);
    expect(result.reasons).toContain(EReasonCode.WINDY);
  });

  it('should calculate penalty correctly for extreme wind (45+ km/h)', () => {
    // 85 km/h -> penalty = 0.7 + clamp((85-45)/40, 0, 1) * 0.3 = 0.7 + 1 * 0.3 = 1.0
    // score = 0
    const result = calcComfort({
      cloudCoverPct: 0,
      humidityPct: 0,
      windSpeedKmh: 85,
    });
    expect(result.comfortScore).toBe(0);
    expect(result.reasons).toContain(EReasonCode.WINDY);
  });

  it('should add WINDY reason for wind >= 30', () => {
    const result = calcComfort({
      cloudCoverPct: 0,
      humidityPct: 0,
      windSpeedKmh: 30,
    });
    expect(result.reasons).toContain(EReasonCode.WINDY);
  });

  it('should clamp wind speed to 0-120 range', () => {
    const result = calcComfort({
      cloudCoverPct: 0,
      humidityPct: 0,
      windSpeedKmh: 200,
    });
    expect(result.comfortScore).toBe(0);
  });
});
