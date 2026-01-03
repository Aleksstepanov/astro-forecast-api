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

  @ApiProperty({
    example: 78,
    minimum: 0,
    maximum: 100,
    description: 'Главное: пригодность неба для наблюдений',
  })
  observingScore!: number;

  @ApiProperty({
    example: 62,
    minimum: 0,
    maximum: 100,
    description: 'Бонус: насколько комфортно стоять на улице',
  })
  comfortScore!: number;

  @ApiProperty({
    enum: EReasonCode,
    isArray: true,
    example: ['cloudy_mid', 'windy'],
  })
  reasons!: EReasonCode[];

  @ApiProperty({ type: LlmNarrativeDto })
  narrative!: LlmNarrativeDto;
}
