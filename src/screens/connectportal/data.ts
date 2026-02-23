import type { ComponentProps } from 'react';
import type MaterialIcons from '@react-native-vector-icons/material-icons';

export type ConnectTab = 'Places' | 'Go!' | 'Serve';
export type Coordinate = [number, number];

export type ConnectPortalListItem = {
  id: string;
  title: string;
  location: string;
  tags: string[];
  icon: ComponentProps<typeof MaterialIcons>['name'];
};

export type ConnectPortalMapItem = {
  id: string;
  title: string;
  subtitle: string;
  address: string;
  coordinate: Coordinate;
  type: 'organization' | 'event' | 'job';
};

export const CONNECT_PORTAL_LIST_DATA: Record<ConnectTab, ConnectPortalListItem[]> = {
  Places: [
    {
      id: '1',
      title: 'Grace Community Center',
      location: 'Downtown, Chicago • 1.2 mi',
      tags: ['Weekly', 'Active'],
      icon: 'location-city',
    },
    {
      id: '2',
      title: 'Hope Fellowship',
      location: 'North Side, Chicago • 2.5 mi',
      tags: ['Youth', 'Outreach'],
      icon: 'groups',
    },
    {
      id: '3',
      title: "St. Paul's Cathedral",
      location: 'West Loop, Chicago • 0.8 mi',
      tags: ['Traditional'],
      icon: 'account-balance',
    },
  ],
  'Go!': [
    {
      id: '4',
      title: 'Youth Night Worship',
      location: 'Midtown, Atlanta • Fri 7:00 PM',
      tags: ['Event', 'Live'],
      icon: 'event',
    },
    {
      id: '5',
      title: 'Community Prayer Walk',
      location: 'Buckhead, Atlanta • Sat 9:00 AM',
      tags: ['Outdoor', 'Community'],
      icon: 'directions-walk',
    },
  ],
  Serve: [
    {
      id: '6',
      title: 'Youth Coordinator',
      location: 'North Druid Hills • Full-time',
      tags: ['Serve', 'Hiring'],
      icon: 'work',
    },
    {
      id: '7',
      title: 'Worship Director',
      location: 'Sandy Springs • Part-time',
      tags: ['Music', 'Hiring'],
      icon: 'music-note',
    },
  ],
};

export const CONNECT_PORTAL_MAP_DATA: Record<ConnectTab, ConnectPortalMapItem[]> = {
  Places: [
    {
      id: 'place-1',
      title: 'The Christian Post',
      subtitle: 'Organization',
      address: 'Grandview Ave, Atlanta, GA',
      coordinate: [-84.3895, 33.7535],
      type: 'organization',
    },
    {
      id: 'place-2',
      title: 'Orthodox Times',
      subtitle: 'Organization',
      address: 'Peachtree St NE, Atlanta, GA',
      coordinate: [-84.3866, 33.7629],
      type: 'organization',
    },
    {
      id: 'place-3',
      title: 'Covenant Eyes',
      subtitle: 'Organization',
      address: 'West End, Atlanta, GA',
      coordinate: [-84.4194, 33.7406],
      type: 'organization',
    },
  ],
  'Go!': [
    {
      id: 'event-1',
      title: 'Youth Worship Night',
      subtitle: 'Fri, 7:00 PM',
      address: 'Buckhead, Atlanta, GA',
      coordinate: [-84.3807, 33.8473],
      type: 'event',
    },
    {
      id: 'event-2',
      title: 'Community Prayer Walk',
      subtitle: 'Sat, 9:00 AM',
      address: 'Downtown, Atlanta, GA',
      coordinate: [-84.3929, 33.7488],
      type: 'event',
    },
    {
      id: 'event-3',
      title: 'Faith & Tech Meet',
      subtitle: 'Sun, 1:30 PM',
      address: 'Midtown, Atlanta, GA',
      coordinate: [-84.388, 33.7832],
      type: 'event',
    },
  ],
  Serve: [
    {
      id: 'job-1',
      title: 'Youth Coordinator',
      subtitle: 'Full-time',
      address: 'North Druid Hills, Atlanta, GA',
      coordinate: [-84.3346, 33.8038],
      type: 'job',
    },
    {
      id: 'job-2',
      title: 'Worship Director',
      subtitle: 'Part-time',
      address: 'Sandy Springs, GA',
      coordinate: [-84.3733, 33.9304],
      type: 'job',
    },
    {
      id: 'job-3',
      title: 'Media Producer',
      subtitle: 'Contract',
      address: 'Decatur, GA',
      coordinate: [-84.2977, 33.7748],
      type: 'job',
    },
  ],
};
