import { ApiProperty } from '@nestjs/swagger';
import { EReasonCode } from '../../../core/observing';
import { LlmNarrativeDto } from '../../llm/dto/llm-narrative.dto';

export class ForecastPointDto {
  @ApiProperty({ example: '2026-01-03T00:00:00+03:00' })
  ts!: string;

  @ApiProperty({ example: 35, nullable: true, minimum: 0, maximum: 100 })
  cloud!: number | null;

  @ApiProperty({ example: 80, nullable: true, minimum: 0, maximum: 100 })
  humidity!: number | null;

  @ApiProperty({ example: 12.3, nullable: true })
  wind!: number | null;

  @ApiProperty({ example: 78, minimum: 0, maximum: 100 })
  observingScore!: number;

  @ApiProperty({ example: 62, minimum: 0, maximum: 100 })
  comfortScore!: number;

  @ApiProperty({
    enum: EReasonCode,
    isArray: true,
    example: ['cloudy_mid', 'windy'],
  })
  reasons!: EReasonCode[];
}

export class ForecastMetaDto {
  @ApiProperty({ example: 55.7558 })
  lat!: number;

  @ApiProperty({ example: 37.6173 })
  lon!: number;

  @ApiProperty({ example: 'Europe/Moscow' })
  tz!: string;

  @ApiProperty({ example: 'week', enum: ['day', 'week', 'month'] as const })
  period!: 'day' | 'week' | 'month';

  @ApiProperty({ example: '2026-01-03T08:28:27.112Z' })
  generatedAt!: string;

  @ApiProperty({ example: 'open-meteo' })
  source!: 'open-meteo';
}

export class ForecastResponseDto {
  @ApiProperty({ type: ForecastMetaDto })
  meta!: ForecastMetaDto;

  @ApiProperty({ type: ForecastPointDto, isArray: true })
  timeseries!: ForecastPointDto[];

  @ApiProperty({ type: LlmNarrativeDto })
  narrative!: LlmNarrativeDto;
}
