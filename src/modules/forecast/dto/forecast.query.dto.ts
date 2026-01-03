import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsString, Max, Min } from 'class-validator';

export class ForecastQueryDto {
  @ApiProperty({ example: 55.7558 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: 37.6173 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon!: number;

  @ApiProperty({ example: 'Europe/Moscow', description: 'IANA timezone' })
  @IsString()
  tz!: string;

  @ApiProperty({ example: 'week', enum: ['day', 'week', 'month'] as const })
  @IsIn(['day', 'week', 'month'])
  period!: 'day' | 'week' | 'month';
}
