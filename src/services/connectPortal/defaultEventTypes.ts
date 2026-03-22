import type { ConnectPlaceFilterOption } from './types';

export const CONNECT_DEFAULT_EVENT_TYPE_NAMES = [
  'Bible Study',
  'Prayer Night',
  'Worship Night',
  'Revival',
  'Conference',
  'Retreat',
  'Youth Gathering',
  'Young Adult Gathering',
  "Men's Ministry",
  "Women's Ministry",
  'Marriage Event',
  'Singles Event',
  'Community Outreach',
  'Mission Trip',
  'Leadership Training',
  'Discipleship Class',
  'Church Service',
  'Baptism Service',
  'Fellowship Dinner',
  'Family Event',
  'Holiday Service',
  'Fundraiser',
] as const;

export const CONNECT_DEFAULT_EVENT_TYPE_OPTIONS: ConnectPlaceFilterOption[] =
  CONNECT_DEFAULT_EVENT_TYPE_NAMES.map((name) => ({
    label: name,
    value: name,
  }));
