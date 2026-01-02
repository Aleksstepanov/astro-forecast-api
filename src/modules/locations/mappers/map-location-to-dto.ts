import type { TLocation } from '../types';
import { LocationDto } from '../dto';

export const mapLocationToDto = (src: TLocation): LocationDto => {
  const dto = new LocationDto();
  dto.id = src.id;
  dto.name = src.name;
  dto.lat = src.lat;
  dto.lon = src.lon;
  dto.tz = src.tz;
  return dto;
};
