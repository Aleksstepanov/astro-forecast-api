export type TLocation = Readonly<{
  id: string;
  name: string;
  lat: number;
  lon: number;
  tz: string; // IANA
}>;

export type TLocationsResponse = ReadonlyArray<TLocation>;
