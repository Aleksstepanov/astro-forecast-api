import { Injectable } from '@nestjs/common';
import { LOCATIONS } from './data';
import type { TLocationsResponse } from './types';

@Injectable()
export class LocationsService {
  getAll = (): TLocationsResponse => LOCATIONS;
}
