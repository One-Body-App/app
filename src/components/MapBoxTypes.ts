export enum MapBoxTypes {
  country = 'country',
  region = 'region',
  postcode = 'postcode',
  district = 'district',
  place = 'place',
  locality = 'locality',
  neighborhood = 'neighborhood',
  address = 'address',
  poi = 'poi',
}

export type MapSuggestion = {
  bbox: number[];
  center: number[];
  geometry: { type: string; coordinates: number[] };
  id: string;
  place_name: string;
  place_type: string[];
  properties: { wikidata: string; short_code: string };
  relevance: 1;
  text: string;
  type: string;
};
