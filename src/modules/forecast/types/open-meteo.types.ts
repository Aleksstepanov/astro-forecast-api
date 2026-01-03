export type TOpenMeteoHourly = Readonly<{
  time: number[];
  cloud_cover?: number[];
  cloud_cover_low?: number[];
  cloud_cover_mid?: number[];
  cloud_cover_high?: number[];
  relative_humidity_2m?: number[];
  wind_speed_10m?: number[];
}>;

export type TOpenMeteoResponse = Readonly<{
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: TOpenMeteoHourly;
}>;
