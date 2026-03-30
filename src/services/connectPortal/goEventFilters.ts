import type { ConnectGoFilters, ConnectGoQuickChip, ConnectPortalPublishedEvent } from './types';

const normalize = (value: string) => value.trim().toLowerCase();

const matchesSearch = (query: string, values: Array<string | undefined>) => {
  if (!query) {
    return true;
  }

  return values.some((value) => normalize(String(value || '')).includes(query));
};

export const isUpcomingConnectEvent = (startDate: string) => {
  if (!startDate) {
    return true;
  }

  return startDate >= new Date().toISOString().slice(0, 10);
};

export const filterConnectGoEvents = ({
  events,
  filters,
  quickFilter,
  searchText,
}: {
  events: ConnectPortalPublishedEvent[];
  filters: ConnectGoFilters;
  quickFilter: ConnectGoQuickChip;
  searchText: string;
}) => {
  const searchQuery = normalize(searchText);
  const filtered = events.filter((eventRecord) => {
    if (filters.eventType && normalize(eventRecord.eventType) !== normalize(filters.eventType)) {
      return false;
    }

    if (filters.category && normalize(eventRecord.category) !== normalize(filters.category)) {
      return false;
    }

    if (quickFilter === 'Upcoming' && !isUpcomingConnectEvent(eventRecord.startDate)) {
      return false;
    }

    if (quickFilter === 'Online' && !eventRecord.isOnline) {
      return false;
    }

    if (quickFilter === 'In Person' && eventRecord.isOnline) {
      return false;
    }

    if (
      quickFilter === 'Live' &&
      !eventRecord.isLive &&
      !eventRecord.tags.some((tag) => normalize(tag) === 'live')
    ) {
      return false;
    }

    return matchesSearch(searchQuery, [
      eventRecord.title,
      eventRecord.venueName,
      eventRecord.address,
      eventRecord.eventType,
      eventRecord.category,
      ...eventRecord.tags,
    ]);
  });

  return [...filtered].sort((left, right) => {
    if (filters.sort === 'alphabetical') {
      return left.title.localeCompare(right.title);
    }

    if (filters.sort === 'recently_updated') {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    const dateCompare = (left.startDate || '').localeCompare(right.startDate || '');
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return (left.startTime || '').localeCompare(right.startTime || '');
  });
};
