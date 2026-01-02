import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ example: 'msk' })
  id!: string;

  @ApiProperty({ example: 'Москва' })
  name!: string;

  @ApiProperty({ example: 55.7558, minimum: -90, maximum: 90 })
  lat!: number;

  @ApiProperty({ example: 37.6173, minimum: -180, maximum: 180 })
  lon!: number;

  @ApiProperty({ example: 'Europe/Moscow', description: 'IANA timezone' })
  tz!: string;
}
