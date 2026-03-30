import { filterConnectGoEvents } from '../goEventFilters';
import type { ConnectPortalPublishedEvent } from '../types';

const createEvent = (
  overrides: Partial<ConnectPortalPublishedEvent> &
    Pick<ConnectPortalPublishedEvent, 'id' | 'title' | 'eventType'>
): ConnectPortalPublishedEvent => ({
  id: overrides.id,
  title: overrides.title,
  eventType: overrides.eventType,
  status: 'published',
  createdAt: overrides.createdAt || '2026-01-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt || '2026-01-01T00:00:00.000Z',
  publishedAt: overrides.publishedAt || '2026-01-01T00:00:00.000Z',
  category: overrides.category || 'COMMUNITY',
  organizerName: overrides.organizerName || 'OneBody',
  organizerRole: overrides.organizerRole || 'Host',
  startDate: overrides.startDate || '2099-01-01',
  endDate: overrides.endDate || overrides.startDate || '2099-01-01',
  startTime: overrides.startTime || '6:00 PM',
  endTime: overrides.endTime || '8:00 PM',
  isSingleDayEvent: overrides.isSingleDayEvent ?? true,
  isOnline: overrides.isOnline ?? false,
  onlineEventUrl: overrides.onlineEventUrl || '',
  externalEventUrl: overrides.externalEventUrl || '',
  locationQuery: overrides.locationQuery || '',
  venueName: overrides.venueName || '',
  address: overrides.address || '',
  coordinate: overrides.coordinate || [-84.388, 33.749],
  description: overrides.description || '',
  capacity: overrides.capacity || '100',
  ticketType: overrides.ticketType || 'free',
  paymentOption: overrides.paymentOption || 'external',
  payoutConfigured: overrides.payoutConfigured ?? false,
  ticketTiers: overrides.ticketTiers || [],
  businessName: overrides.businessName || '',
  ein: overrides.ein || '',
  registrationCount: overrides.registrationCount ?? 0,
  viewCount: overrides.viewCount ?? 0,
  openCount: overrides.openCount ?? 0,
  tags: overrides.tags || [],
  photoUri: overrides.photoUri,
  heroImageUri: overrides.heroImageUri,
  ownerUserId: overrides.ownerUserId,
  isLive: overrides.isLive,
});

describe('filterConnectGoEvents', () => {
  const baseFilters = {
    sort: 'upcoming' as const,
    eventType: '',
    category: '',
  };

  it('filters by event type from the shared filter value', () => {
    const events = [
      createEvent({ id: '1', title: 'Conference Night', eventType: 'Conference' }),
      createEvent({ id: '2', title: 'Bible Study', eventType: 'Bible Study' }),
    ];

    const result = filterConnectGoEvents({
      events,
      filters: { ...baseFilters, eventType: 'Conference' },
      quickFilter: 'Upcoming',
      searchText: '',
    });

    expect(result.map((event) => event.id)).toEqual(['1']);
  });

  it.each([
    ['Upcoming', createEvent({ id: '1', title: 'Future Event', eventType: 'Conference' })],
    [
      'Online',
      createEvent({ id: '2', title: 'Online Event', eventType: 'Conference', isOnline: true }),
    ],
    [
      'In Person',
      createEvent({ id: '3', title: 'In-Person Event', eventType: 'Conference', isOnline: false }),
    ],
    [
      'Live',
      createEvent({ id: '4', title: 'Live Event', eventType: 'Conference', tags: ['Live'] }),
    ],
  ] as const)('applies the %s quick filter', (quickFilter, matchingEvent) => {
    const nonMatchingEvent = createEvent({
      id: '9',
      title: 'Other Event',
      eventType: 'Conference',
      startDate: quickFilter === 'Upcoming' ? '2020-01-01' : '2099-01-01',
      isOnline: quickFilter !== 'Online',
      tags: quickFilter === 'Live' ? [] : ['Other'],
    });

    const result = filterConnectGoEvents({
      events: [matchingEvent, nonMatchingEvent],
      filters: baseFilters,
      quickFilter,
      searchText: '',
    });

    expect(result.map((event) => event.id)).toEqual([matchingEvent.id]);
  });

  it('combines search text with event type filtering', () => {
    const events = [
      createEvent({
        id: '1',
        title: 'Downtown Conference',
        eventType: 'Conference',
        venueName: 'Atlanta Center',
      }),
      createEvent({
        id: '2',
        title: 'Suburb Conference',
        eventType: 'Conference',
        venueName: 'Marietta Hall',
      }),
    ];

    const result = filterConnectGoEvents({
      events,
      filters: { ...baseFilters, eventType: 'Conference' },
      quickFilter: 'Upcoming',
      searchText: 'atlanta',
    });

    expect(result.map((event) => event.id)).toEqual(['1']);
  });

  it('sorts filtered results by the requested sort order', () => {
    const events = [
      createEvent({
        id: '1',
        title: 'Zebra Conference',
        eventType: 'Conference',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      createEvent({
        id: '2',
        title: 'Alpha Conference',
        eventType: 'Conference',
        updatedAt: '2026-01-03T00:00:00.000Z',
      }),
    ];

    expect(
      filterConnectGoEvents({
        events,
        filters: { ...baseFilters, sort: 'alphabetical' },
        quickFilter: 'Upcoming',
        searchText: '',
      }).map((event) => event.id)
    ).toEqual(['2', '1']);

    expect(
      filterConnectGoEvents({
        events,
        filters: { ...baseFilters, sort: 'recently_updated' },
        quickFilter: 'Upcoming',
        searchText: '',
      }).map((event) => event.id)
    ).toEqual(['2', '1']);
  });
});
