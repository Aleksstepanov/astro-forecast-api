import type { TLocation } from '../types';

export const LOCATIONS: ReadonlyArray<TLocation> = [
  {
    id: 'msk',
    name: 'Москва',
    lat: 55.7558,
    lon: 37.6173,
    tz: 'Europe/Moscow',
  },
  {
    id: 'spb',
    name: 'Санкт-Петербург',
    lat: 59.9386,
    lon: 30.3141,
    tz: 'Europe/Moscow',
  },
  { id: 'pnz', name: 'Пенза', lat: 53.1959, lon: 45.0183, tz: 'Europe/Moscow' },
] as const;
