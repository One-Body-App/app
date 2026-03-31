import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO } from 'date-fns';
import ApiCall from '@/src/services/api';
import type {
  ConnectPortalListItem,
  ConnectPortalMapItem,
  Coordinate,
} from '@/src/screens/connectportal/data';
import type {
  ConnectPortalAnalyticsResponse,
  ConnectPlaceFilterOption,
  ConnectPlaceFilters,
  ConnectPlaceRecord,
  ConnectPlacesResponse,
  ConnectPortalCacheSnapshot,
  ConnectPortalCreateStep,
  ConnectPortalEventDraft,
  ConnectPortalEventRecord,
  ConnectPortalEventRecordBase,
  ConnectPortalMyEventsFilter,
  ConnectPortalOrganizerSummary,
  ConnectPortalPaymentOption,
  ConnectPortalPublishedEvent,
  ConnectPortalResumeResolution,
  ConnectServeJobCompensationFrequency,
  ConnectServeJobDraft,
  ConnectServeJobPublished,
  ConnectServeJobRecord,
  ConnectPortalTicketType,
  ConnectViewMode,
  TicketTier,
} from './types';

const CONNECT_PORTAL_DRAFTS_STORAGE_KEY = '@onebody/connect-portal/drafts.v2';
const CACHE_TTL_MS = 30_000;
const DEFAULT_COORDINATE: Coordinate = [-84.388, 33.749];

type ConnectPortalApiClient = {
  listPublicEvents: () => Promise<ConnectPortalPublishedEvent[]>;
  listOrganizerEvents: () => Promise<ConnectPortalPublishedEvent[]>;
  getEvent: (eventId: string) => Promise<ConnectPortalPublishedEvent | null>;
  getEventAnalytics: (eventId: string) => Promise<ConnectPortalAnalyticsResponse>;
  publishEvent: (payload: Record<string, unknown>) => Promise<ConnectPortalPublishedEvent | null>;
  trackEventTelemetry: (
    eventId: string,
    eventType: 'publish' | 'detail_open' | 'detail_view' | 'manage_view',
    metadata?: Record<string, unknown>
  ) => Promise<void>;
};

type ConnectPortalStorageDependencies = {
  storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;
  now: () => string;
  createId: () => string;
  apiClient: ConnectPortalApiClient;
};

const createTicketTier = (overrides?: Partial<TicketTier>): TicketTier => ({
  id: overrides?.id || `ticket-${Math.round(Math.random() * 100000)}`,
  name: overrides?.name || 'General Admission',
  quantity: overrides?.quantity || '100',
  price: overrides?.price || '0.00',
});

const createSeededPublishedEvent = (
  overrides: Partial<ConnectPortalPublishedEvent> &
    Pick<ConnectPortalPublishedEvent, 'id' | 'title'>
): ConnectPortalPublishedEvent => {
  const now = new Date().toISOString();
  return {
    id: overrides.id,
    status: 'published',
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
    publishedAt: overrides.publishedAt || now,
    title: overrides.title,
    eventType: overrides.eventType || 'Community Event',
    category: overrides.category || 'COMMUNITY',
    photoUri: overrides.photoUri,
    heroImageUri: overrides.heroImageUri,
    organizerName: overrides.organizerName || 'OneBody Team',
    organizerRole: overrides.organizerRole || 'Community Organizer',
    startDate: overrides.startDate || '2026-06-01',
    endDate: overrides.endDate || overrides.startDate || '2026-06-01',
    startTime: overrides.startTime || '6:00 PM',
    endTime: overrides.endTime || '8:00 PM',
    isSingleDayEvent:
      overrides.isSingleDayEvent ??
      (Boolean(overrides.startDate || overrides.endDate) &&
        (overrides.endDate || overrides.startDate || '2026-06-01') ===
          (overrides.startDate || '2026-06-01')),
    isOnline: overrides.isOnline ?? false,
    onlineEventUrl: overrides.onlineEventUrl || '',
    externalEventUrl: overrides.externalEventUrl || '',
    locationQuery: overrides.locationQuery || overrides.address || '',
    venueName: overrides.venueName || 'OneBody Hall',
    address: overrides.address || '123 Main St, Atlanta, GA',
    coordinate: overrides.coordinate || DEFAULT_COORDINATE,
    description:
      overrides.description ||
      'Join the OneBody community for encouragement, worship, and practical connection.',
    capacity: overrides.capacity || '150',
    ticketType: overrides.ticketType || 'free',
    paymentOption: overrides.paymentOption || 'external',
    payoutConfigured: overrides.payoutConfigured ?? false,
    ticketTiers: overrides.ticketTiers || [createTicketTier()],
    businessName: overrides.businessName || '',
    ein: overrides.ein || '',
    registrationCount: overrides.registrationCount ?? 0,
    viewCount: overrides.viewCount ?? 0,
    openCount: overrides.openCount ?? 0,
    tags: overrides.tags || ['Event', 'Live'],
    ownerUserId: overrides.ownerUserId,
    isLive: overrides.isLive ?? true,
  };
};

const getFutureDate = (daysFromNow: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
};

const SEEDED_GO_EVENTS: ConnectPortalPublishedEvent[] = [
  createSeededPublishedEvent({
    id: 'seed-go-summer-mixer',
    title: 'Summer Community Mixer',
    eventType: 'Mixer',
    category: 'COMMUNITY',
    organizerName: 'Sarah Jenkins',
    organizerRole: 'Community Health Lead',
    startDate: getFutureDate(163),
    endDate: getFutureDate(163),
    startTime: '2:00 PM',
    endTime: '6:00 PM',
    venueName: 'Central Park North Pavilion',
    address: '123 Park Lane, New York, NY',
    coordinate: [-73.948, 40.796],
    description:
      'Bring friends and meet the local OneBody community for an afternoon of worship, food, and conversation.',
    capacity: '150',
    heroImageUri:
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    tags: ['Event', 'Live'],
    registrationCount: 145,
    viewCount: 2100,
    openCount: 480,
  }),
  createSeededPublishedEvent({
    id: 'seed-go-leadership-workshop',
    title: 'Leadership Workshop',
    eventType: 'Workshop',
    category: 'LEADERSHIP',
    organizerName: 'Felix Carter',
    organizerRole: 'Leadership Coach',
    startDate: getFutureDate(182),
    endDate: getFutureDate(182),
    startTime: '10:00 AM',
    endTime: '1:00 PM',
    venueName: 'Downtown Learning Hub',
    address: '88 Peachtree St NE, Atlanta, GA',
    coordinate: [-84.3879, 33.7591],
    description:
      'A hands-on leadership intensive for ministry teams focused on planning, delegation, and sustainable growth.',
    capacity: '50',
    ticketType: 'paid',
    paymentOption: 'internal',
    payoutConfigured: true,
    ticketTiers: [createTicketTier({ name: 'Workshop Pass', quantity: '50', price: '25.00' })],
    businessName: 'Felix Carter Coaching LLC',
    ein: '12-3456789',
    heroImageUri:
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
    tags: ['Event', 'Planning'],
    registrationCount: 20,
    viewCount: 3200,
    openCount: 640,
  }),
];

const SEEDED_CONNECT_PLACES: ConnectPlaceRecord[] = [
  {
    id: 'seed-place-grace-community-center',
    title: 'Grace Community Center',
    avatarUri:
      'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=400&q=80',
    organizationTypeLabel: 'Non-Profit',
    churchTypeLabel: '',
    organizationSize: 'large',
    address: 'Downtown, Chicago, IL',
    coordinate: [-87.6298, 41.8781],
    distanceMiles: 1.2,
    distanceLabel: '1.2 mi away',
    metadataTags: ['ACTIVE', 'LARGE'],
    isActive: true,
    isOpen: true,
    followerCount: 248,
  },
  {
    id: 'seed-place-hope-fellowship',
    title: 'Hope Fellowship',
    avatarUri:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
    organizationTypeLabel: 'Church',
    churchTypeLabel: 'Non-Denominational',
    organizationSize: 'mega',
    address: 'North Side, Chicago, IL',
    coordinate: [-87.6553, 41.95],
    distanceMiles: 2.5,
    distanceLabel: '2.5 mi away',
    metadataTags: ['ACTIVE', 'MEGA'],
    isActive: true,
    isOpen: true,
    followerCount: 1040,
  },
  {
    id: 'seed-place-st-pauls',
    title: "St. Paul's Cathedral",
    avatarUri:
      'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=400&q=80',
    organizationTypeLabel: 'Church',
    churchTypeLabel: 'Catholic',
    organizationSize: 'medium',
    address: 'West Loop, Chicago, IL',
    coordinate: [-87.6477, 41.8827],
    distanceMiles: 0.8,
    distanceLabel: '0.8 mi away',
    metadataTags: ['ACTIVE', 'MEDIUM'],
    isActive: true,
    isOpen: true,
    followerCount: 382,
  },
];

const clampStep = (value: unknown): ConnectPortalCreateStep => {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 7) {
    return numericValue as ConnectPortalCreateStep;
  }
  return 0;
};

// NOTE: Coordinate validation is intentionally duplicated here and in the API service.
// The client normalizes before display and draft storage; the API validates before persistence.
// Both must agree on the format: [longitude, latitude] tuple of finite numbers.
const normalizeCoordinate = (value: unknown): Coordinate | undefined => {
  if (!Array.isArray(value) || value.length < 2) {
    return undefined;
  }

  const longitude = Number(value[0]);
  const latitude = Number(value[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return undefined;
  }

  return [longitude, latitude];
};

const normalizeTicketType = (value: unknown): ConnectPortalTicketType => {
  if (value === 'paid') {
    return 'paid';
  }
  if (value === 'external') {
    return 'external';
  }
  return 'free';
};

const normalizePaymentOption = (value: unknown): ConnectPortalPaymentOption =>
  value === 'internal' ? 'internal' : 'external';

const normalizeTicketTiers = (value: unknown): TicketTier[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const items = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Partial<TicketTier> & {
        quantity?: string | number;
        price?: string | number;
      };
      return {
        id: candidate.id || `ticket-${index + 1}`,
        name: String(candidate.name || '').trim() || `Ticket ${index + 1}`,
        quantity: String(candidate.quantity || '').trim() || '0',
        price: String(candidate.price || '').trim() || '0.00',
      };
    })
    .filter(Boolean) as TicketTier[];

  return items;
};

const normalizeDraft = (value: unknown): ConnectPortalEventDraft | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<ConnectPortalEventDraft>;
  if (typeof item.id !== 'string' || !item.id.trim()) {
    return null;
  }

  return {
    id: item.id,
    status: 'draft',
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    lastCompletedStep: clampStep(item.lastCompletedStep),
    publishedEventId: typeof item.publishedEventId === 'string' ? item.publishedEventId : undefined,
    title: String(item.title || ''),
    eventType: String(item.eventType || ''),
    category: String(item.category || item.eventType || 'EVENT').toUpperCase(),
    photoUri: typeof item.photoUri === 'string' ? item.photoUri : undefined,
    heroImageUri: typeof item.heroImageUri === 'string' ? item.heroImageUri : undefined,
    organizerName: String(item.organizerName || 'You'),
    organizerRole: String(item.organizerRole || 'Event Organizer'),
    startDate: String(item.startDate || ''),
    endDate: String(item.endDate || ''),
    startTime: String(item.startTime || ''),
    endTime: String(item.endTime || ''),
    isSingleDayEvent:
      item.isSingleDayEvent === true ||
      (item.isSingleDayEvent === undefined &&
        Boolean(item.startDate) &&
        String(item.startDate || '') === String(item.endDate || item.startDate || '')),
    isOnline: item.isOnline === true,
    onlineEventUrl: String(
      item.onlineEventUrl || (item.isOnline ? item.externalEventUrl : '') || ''
    ),
    externalEventUrl: String((item as Partial<ConnectPortalEventDraft>).externalEventUrl || ''),
    locationQuery: String(item.locationQuery || ''),
    venueName: String(item.venueName || ''),
    address: String(item.address || ''),
    coordinate: normalizeCoordinate(item.coordinate),
    description: String(item.description || ''),
    capacity: String(item.capacity || ''),
    ticketType: normalizeTicketType(item.ticketType),
    paymentOption: normalizePaymentOption(item.paymentOption),
    payoutConfigured: item.payoutConfigured === true,
    ticketTiers: normalizeTicketTiers(item.ticketTiers),
    businessName: String(item.businessName || ''),
    ein: String(item.ein || ''),
    registrationCount: Number(item.registrationCount || 0),
    viewCount: Number(item.viewCount || 0),
    openCount: Number(item.openCount || 0),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : ['Draft'],
  };
};

const normalizePublishedEvent = (value: unknown): ConnectPortalPublishedEvent | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<ConnectPortalPublishedEvent> & {
    coordinate?: Coordinate;
    ownerUserId?: string;
    isLive?: boolean;
  };
  let id = '';
  if (typeof item.id === 'string') {
    id = item.id;
  } else if (typeof (item as any)._id === 'string') {
    id = (item as any)._id;
  }
  if (!id) {
    return null;
  }

  let publishedAt = new Date().toISOString();
  if (typeof item.publishedAt === 'string') {
    publishedAt = item.publishedAt;
  } else if (typeof item.updatedAt === 'string') {
    publishedAt = item.updatedAt;
  }

  return {
    id,
    status: 'published',
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    publishedAt,
    title: String(item.title || ''),
    eventType: String(item.eventType || ''),
    category: String(item.category || item.eventType || 'EVENT').toUpperCase(),
    photoUri: typeof item.photoUri === 'string' ? item.photoUri : undefined,
    heroImageUri: typeof item.heroImageUri === 'string' ? item.heroImageUri : undefined,
    organizerName: String(item.organizerName || 'OneBody'),
    organizerRole: String(item.organizerRole || 'Event Organizer'),
    startDate: String(item.startDate || ''),
    endDate: String(item.endDate || item.startDate || ''),
    startTime: String(item.startTime || ''),
    endTime: String(item.endTime || ''),
    isSingleDayEvent:
      item.isSingleDayEvent === true ||
      (item.isSingleDayEvent === undefined &&
        Boolean(item.startDate) &&
        String(item.startDate || '') === String(item.endDate || item.startDate || '')),
    isOnline: item.isOnline === true,
    onlineEventUrl: String(
      item.onlineEventUrl || (item.isOnline ? item.externalEventUrl : '') || ''
    ),
    externalEventUrl: String((item as Partial<ConnectPortalPublishedEvent>).externalEventUrl || ''),
    locationQuery: String(item.locationQuery || ''),
    venueName: String(item.venueName || ''),
    address: String(item.address || ''),
    coordinate: normalizeCoordinate(item.coordinate || (item as any).location?.coordinates),
    description: String(item.description || ''),
    capacity: item.capacity === undefined || item.capacity === null ? '' : String(item.capacity),
    ticketType: normalizeTicketType(item.ticketType),
    paymentOption: normalizePaymentOption(item.paymentOption),
    payoutConfigured: item.payoutConfigured === true,
    ticketTiers: normalizeTicketTiers(item.ticketTiers),
    businessName: String(item.businessName || ''),
    ein: String(item.ein || ''),
    registrationCount: Number(item.registrationCount || 0),
    viewCount: Number(item.viewCount || 0),
    openCount: Number(item.openCount || 0),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : ['Event', 'Live'],
    ownerUserId: typeof item.ownerUserId === 'string' ? item.ownerUserId : undefined,
    isLive: item.isLive !== false,
  };
};

const sortByUpdatedDesc = <T extends { updatedAt: string }>(items: T[]) =>
  [...items].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));

const isPastEvent = (record: ConnectPortalPublishedEvent, nowIso: string) => {
  const comparisonTarget = record.endDate || record.startDate;
  if (!comparisonTarget) {
    return false;
  }

  try {
    return parseISO(`${comparisonTarget}T23:59:59.000Z`).getTime() < parseISO(nowIso).getTime();
  } catch {
    return false;
  }
};

const getLifecycleFilter = (
  record: ConnectPortalEventRecord,
  nowIso: string
): ConnectPortalMyEventsFilter => {
  if (record.status === 'draft') {
    return 'Draft';
  }

  return isPastEvent(record, nowIso) ? 'Past' : 'Active';
};

const formatDateLabel = (dateValue: string) => {
  if (!dateValue) {
    return 'Date TBD';
  }

  try {
    return format(parseISO(`${dateValue}T12:00:00.000Z`), 'MMM d, yyyy');
  } catch {
    return dateValue;
  }
};

const formatDateTimeLabel = (
  record: Pick<ConnectPortalEventRecordBase, 'startDate' | 'startTime'>
) => {
  const dateLabel = formatDateLabel(record.startDate);
  return record.startTime ? `${dateLabel} • ${record.startTime}` : dateLabel;
};

const getCapacityValue = (record: ConnectPortalEventRecordBase) => {
  const parsed = Number(record.capacity);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const toListItem = (record: ConnectPortalPublishedEvent): ConnectPortalListItem => ({
  id: record.id,
  title: record.title,
  location: `${record.venueName || record.address || 'Location TBD'} • ${formatDateTimeLabel(record)}`,
  tags: record.tags.length > 0 ? record.tags : ['Event'],
  icon: 'event',
});

const toMapItem = (record: ConnectPortalPublishedEvent): ConnectPortalMapItem => ({
  id: record.id,
  title: record.title,
  subtitle: formatDateTimeLabel(record),
  address: record.address || record.venueName || 'Location TBD',
  coordinate: record.coordinate || DEFAULT_COORDINATE,
  type: 'event',
});

const createEmptyDraft = (
  nowIso: string,
  createId: () => string,
  overrides?: Partial<ConnectPortalEventDraft>
): ConnectPortalEventDraft => ({
  id: overrides?.id || createId(),
  status: 'draft',
  createdAt: overrides?.createdAt || nowIso,
  updatedAt: overrides?.updatedAt || nowIso,
  lastCompletedStep: overrides?.lastCompletedStep ?? 0,
  publishedEventId: overrides?.publishedEventId,
  title: overrides?.title || '',
  eventType: overrides?.eventType || '',
  category: overrides?.category || 'EVENT',
  photoUri: overrides?.photoUri,
  heroImageUri: overrides?.heroImageUri,
  organizerName: overrides?.organizerName || 'You',
  organizerRole: overrides?.organizerRole || 'Event Organizer',
  startDate: overrides?.startDate || '',
  endDate: overrides?.endDate || '',
  startTime: overrides?.startTime || '',
  endTime: overrides?.endTime || '',
  isSingleDayEvent:
    overrides?.isSingleDayEvent ??
    (Boolean(overrides?.startDate) &&
      (overrides?.endDate || overrides?.startDate || '') === (overrides?.startDate || '')),
  isOnline: overrides?.isOnline ?? false,
  onlineEventUrl: overrides?.onlineEventUrl || '',
  externalEventUrl: overrides?.externalEventUrl || '',
  locationQuery: overrides?.locationQuery || '',
  venueName: overrides?.venueName || '',
  address: overrides?.address || '',
  coordinate: overrides?.coordinate,
  description: overrides?.description || '',
  capacity: overrides?.capacity || '',
  ticketType: overrides?.ticketType || 'free',
  paymentOption: overrides?.paymentOption || 'external',
  payoutConfigured: overrides?.payoutConfigured ?? false,
  ticketTiers: overrides?.ticketTiers || [createTicketTier()],
  businessName: overrides?.businessName || '',
  ein: overrides?.ein || '',
  registrationCount: overrides?.registrationCount ?? 0,
  viewCount: overrides?.viewCount ?? 0,
  openCount: overrides?.openCount ?? 0,
  tags: overrides?.tags || ['Draft'],
});

export const requiresPayoutStep = (
  record: Pick<ConnectPortalEventRecordBase, 'ticketType' | 'paymentOption'>
) => record.ticketType === 'paid' && record.paymentOption === 'internal';

export const getDraftResumeRouteName = (record: ConnectPortalEventDraft) => {
  if (record.lastCompletedStep < 1) return 'ConnectGoCreateStep1';
  if (record.lastCompletedStep < 2) return 'ConnectGoCreateStep2';
  if (record.lastCompletedStep < 3) return 'ConnectGoCreateStep3';
  if (record.lastCompletedStep < 4) return 'ConnectGoCreateStep4';
  if (record.ticketType === 'external') return 'ConnectGoCreateStep6Review';
  if (record.lastCompletedStep < 5) return 'ConnectGoCreateStep5';
  if (requiresPayoutStep(record) && !record.payoutConfigured) return 'ConnectGoCreateStep6Payout';
  return 'ConnectGoCreateStep6Review';
};

const createDefaultApiClient = (): ConnectPortalApiClient => {
  const unwrap = async <T>(request: Promise<{ status: number; response: T }>) => {
    const result = await request;
    if (result.status >= 400) {
      throw new Error((result.response as any)?.message || 'Connect portal request failed');
    }
    return result.response;
  };

  return {
    listPublicEvents: async () => {
      const response = await unwrap<any[]>(
        ApiCall({ route: 'connect/events/public', verb: 'get' })
      );
      return response.map(normalizePublishedEvent).filter(Boolean) as ConnectPortalPublishedEvent[];
    },
    listOrganizerEvents: async () => {
      const response = await unwrap<any[]>(
        ApiCall({ route: 'connect/events/mine', verb: 'get', token: true })
      );
      return response.map(normalizePublishedEvent).filter(Boolean) as ConnectPortalPublishedEvent[];
    },
    getEvent: async (eventId: string) => {
      const response = await unwrap<any>(
        ApiCall({ route: `connect/events/${eventId}`, verb: 'get', token: true })
      );
      return normalizePublishedEvent(response);
    },
    getEventAnalytics: async (eventId: string) =>
      unwrap<any>(
        ApiCall({ route: `connect/events/${eventId}/analytics`, verb: 'get', token: true })
      ),
    publishEvent: async (payload: Record<string, unknown>) => {
      const heroImageUri =
        typeof payload.heroImageUri === 'string' ? payload.heroImageUri : undefined;

      if (heroImageUri && !/^https?:\/\//i.test(heroImageUri)) {
        const formData = new FormData();
        formData.append('heroImage', {
          uri: heroImageUri,
          name: 'event-hero.jpg',
          type: 'image/jpeg',
        } as any);
        Object.entries(payload).forEach(([key, value]) => {
          if (
            key !== 'heroImageUri' &&
            key !== 'photoUri' &&
            value !== undefined &&
            value !== null
          ) {
            formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
          }
        });
        const formResponse = await unwrap<any>(
          ApiCall({
            route: 'connect/events/publish',
            verb: 'post',
            token: true,
            params: formData,
            isFormUrlEncode: true,
          })
        );
        return normalizePublishedEvent(formResponse);
      }

      const response = await unwrap<any>(
        ApiCall({ route: 'connect/events/publish', verb: 'post', token: true, params: payload })
      );
      return normalizePublishedEvent(response);
    },
    trackEventTelemetry: async (eventId, eventType, metadata) => {
      await ApiCall({
        route: `connect/events/${eventId}/telemetry`,
        verb: 'post',
        token: true,
        params: {
          eventType,
          metadata,
        },
        suppressErrorLog: true,
      });
    },
  };
};

const defaultDependencies: ConnectPortalStorageDependencies = {
  storage: AsyncStorage,
  now: () => new Date().toISOString(),
  createId: () => `connect-draft-${Date.now()}-${Math.round(Math.random() * 100000)}`,
  apiClient: createDefaultApiClient(),
};

export const createConnectPortalStorage = (
  dependencies: Partial<ConnectPortalStorageDependencies> = {}
) => {
  const { storage, now, createId, apiClient } = { ...defaultDependencies, ...dependencies };

  let draftsCache: ConnectPortalEventDraft[] | null = null;
  let memoryCache: ConnectPortalCacheSnapshot = {
    drafts: [],
    organizerPublished: [],
    publicPublished: [],
    loadedAt: null,
  };

  const readDrafts = async () => {
    if (draftsCache) {
      return draftsCache;
    }

    const rawValue = await storage.getItem(CONNECT_PORTAL_DRAFTS_STORAGE_KEY);
    if (!rawValue) {
      draftsCache = [];
      return draftsCache;
    }

    try {
      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) {
        draftsCache = [];
        return draftsCache;
      }
      draftsCache = sortByUpdatedDesc(
        parsed.map(normalizeDraft).filter(Boolean) as ConnectPortalEventDraft[]
      );
      return draftsCache;
    } catch {
      draftsCache = [];
      return draftsCache;
    }
  };

  const writeDrafts = async (drafts: ConnectPortalEventDraft[]) => {
    draftsCache = sortByUpdatedDesc(drafts);
    await storage.setItem(CONNECT_PORTAL_DRAFTS_STORAGE_KEY, JSON.stringify(draftsCache));
    memoryCache = {
      ...memoryCache,
      drafts: draftsCache,
      loadedAt: Date.now(),
    };
  };

  const refreshPublishedEvents = async (force = false) => {
    const isFresh =
      !force && memoryCache.loadedAt !== null && Date.now() - memoryCache.loadedAt < CACHE_TTL_MS;
    if (isFresh) {
      return memoryCache;
    }

    const [drafts, publicResult, organizerResult] = await Promise.all([
      readDrafts(),
      apiClient.listPublicEvents().catch(() => null),
      apiClient.listOrganizerEvents().catch(() => null),
    ]);

    memoryCache = {
      drafts,
      publicPublished:
        publicResult && publicResult.length > 0
          ? sortByUpdatedDesc(publicResult)
          : SEEDED_GO_EVENTS,
      organizerPublished: organizerResult ? sortByUpdatedDesc(organizerResult) : [],
      loadedAt: Date.now(),
    };

    return memoryCache;
  };

  const invalidatePublishedCache = () => {
    memoryCache = {
      ...memoryCache,
      loadedAt: null,
    };
  };

  const getDraftEventById = async (draftId: string) => {
    const drafts = await readDrafts();
    return drafts.find((draft) => draft.id === draftId) || null;
  };

  const getResumeResolution = async (draftId?: string): Promise<ConnectPortalResumeResolution> => {
    if (!draftId) {
      return {
        kind: 'missing',
        message: 'This draft could not be found. Start a new event or reopen a saved draft.',
      };
    }

    const draft = await getDraftEventById(draftId);
    if (!draft) {
      return {
        kind: 'missing',
        message:
          'This draft is no longer available. Open a saved draft from My Events or start again.',
      };
    }

    return {
      kind: 'draft',
      draft,
    };
  };

  const getPublishedGoEvents = async (force = false) => {
    const cache = await refreshPublishedEvents(force);
    return cache.publicPublished;
  };

  const getOrganizerPublishedEvents = async (force = false) => {
    const cache = await refreshPublishedEvents(force);
    return cache.organizerPublished;
  };

  const getUserRecords = async () => readDrafts();

  const getOrganizerEvents = async () => {
    const [drafts, published] = await Promise.all([readDrafts(), getOrganizerPublishedEvents()]);
    return sortByUpdatedDesc([...published, ...drafts]);
  };

  const getOrganizerSummary = async (): Promise<ConnectPortalOrganizerSummary> => {
    const nowIso = now();
    const [draftEvents, publishedEvents] = await Promise.all([
      readDrafts(),
      getOrganizerPublishedEvents(),
    ]);
    const activeEvents = publishedEvents.filter(
      (record) => getLifecycleFilter(record, nowIso) === 'Active'
    );

    return {
      featuredEvent: activeEvents[0] || publishedEvents[0] || null,
      activeEvents,
      draftEvents,
      allEvents: sortByUpdatedDesc([...publishedEvents, ...draftEvents]),
      totalRegistrations: publishedEvents.reduce(
        (sum, item) => sum + Number(item.registrationCount || 0),
        0
      ),
      totalViews: publishedEvents.reduce((sum, item) => sum + Number(item.viewCount || 0), 0),
      totalOpens: publishedEvents.reduce((sum, item) => sum + Number(item.openCount || 0), 0),
    };
  };

  const getMyEvents = async (filter: ConnectPortalMyEventsFilter = 'All') => {
    const nowIso = now();
    const events = await getOrganizerEvents();
    if (filter === 'All') {
      return events;
    }

    return events.filter((record) => getLifecycleFilter(record, nowIso) === filter);
  };

  const getEventById = async (eventId: string) => {
    const draft = await getDraftEventById(eventId);
    if (draft) {
      return draft;
    }

    const cache = await refreshPublishedEvents();
    const cachedEvent =
      cache.organizerPublished.find((event) => event.id === eventId) ||
      cache.publicPublished.find((event) => event.id === eventId);
    if (cachedEvent) {
      return cachedEvent;
    }

    try {
      return await apiClient.getEvent(eventId);
    } catch {
      return null;
    }
  };

  const createDraftEvent = async (overrides?: Partial<ConnectPortalEventDraft>) => {
    const currentDrafts = await readDrafts();
    const nextDraft = createEmptyDraft(now(), createId, overrides);
    await writeDrafts([nextDraft, ...currentDrafts]);
    return nextDraft;
  };

  const upsertDraftEvent = async (
    draftId: string,
    updates: Partial<ConnectPortalEventDraft>,
    options?: {
      completedStep?: ConnectPortalCreateStep;
      markPayoutConfigured?: boolean;
    }
  ) => {
    const currentDrafts = await readDrafts();
    const nowIso = now();
    const existingDraft = currentDrafts.find((record) => record.id === draftId);
    if (!existingDraft) {
      return null;
    }

    const nextDraft: ConnectPortalEventDraft = {
      ...existingDraft,
      ...updates,
      status: 'draft',
      updatedAt: nowIso,
      payoutConfigured:
        options?.markPayoutConfigured === true
          ? true
          : (updates.payoutConfigured ?? existingDraft.payoutConfigured),
      lastCompletedStep:
        options?.completedStep !== undefined
          ? clampStep(Math.max(existingDraft.lastCompletedStep, options.completedStep))
          : existingDraft.lastCompletedStep,
      tags: ['Draft'],
    };

    const nextDrafts = currentDrafts.filter((record) => record.id !== draftId);
    await writeDrafts([nextDraft, ...nextDrafts]);
    return nextDraft;
  };

  const deleteDraftEvent = async (draftId: string) => {
    const currentDrafts = await readDrafts();
    const nextDrafts = currentDrafts.filter((record) => record.id !== draftId);
    await writeDrafts(nextDrafts);
  };

  const publishDraftEvent = async (draftId: string) => {
    const draft = await getDraftEventById(draftId);
    if (!draft) {
      return null;
    }

    const payload = {
      eventId: draft.publishedEventId,
      title: draft.title,
      eventType: draft.eventType,
      category: draft.category || draft.eventType || 'EVENT',
      photoUri: draft.photoUri,
      heroImageUri: draft.heroImageUri,
      organizerName: draft.organizerName,
      organizerRole: draft.organizerRole,
      startDate: draft.startDate,
      endDate: draft.endDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
      isOnline: draft.isOnline,
      externalEventUrl:
        draft.externalEventUrl || (draft.isOnline ? draft.onlineEventUrl.trim() : ''),
      locationQuery: draft.locationQuery,
      venueName: draft.venueName || (draft.isOnline ? 'Online Event' : ''),
      address: draft.address || (draft.isOnline ? 'Online' : ''),
      coordinate: draft.coordinate || DEFAULT_COORDINATE,
      description: draft.description,
      capacity: draft.capacity || undefined,
      ticketType: draft.ticketType,
      paymentOption: draft.paymentOption,
      payoutConfigured: requiresPayoutStep(draft) ? draft.payoutConfigured : false,
      ticketTiers: draft.ticketTiers.map((tier) => ({
        ...tier,
        quantity: Number(tier.quantity || 0),
        price: Number(tier.price || 0),
      })),
      businessName: draft.businessName,
      ein: draft.ein,
      tags: ['Event', 'Live'],
      isRecurring: draft.isRecurring || false,
      recurrenceFrequency: draft.recurrenceFrequency,
      recurrenceEndType: draft.recurrenceEndType,
      recurrenceEndDate: draft.recurrenceEndDate,
      recurrenceOccurrenceCount: draft.recurrenceOccurrenceCount
        ? Number(draft.recurrenceOccurrenceCount)
        : undefined,
    };

    const publishedRecord = await apiClient.publishEvent(payload);
    if (!publishedRecord) {
      return null;
    }

    await deleteDraftEvent(draftId);
    invalidatePublishedCache();
    await refreshPublishedEvents(true);
    return publishedRecord;
  };

  const getPublicGoListItems = async () => {
    const publishedEvents = await getPublishedGoEvents();
    return publishedEvents.map(toListItem);
  };

  const getPublicGoMapItems = async () => {
    const publishedEvents = await getPublishedGoEvents();
    return publishedEvents.map(toMapItem);
  };

  const getEventAnalytics = async (eventId: string) => apiClient.getEventAnalytics(eventId);

  const trackEventTelemetry = async (
    eventId: string,
    eventType: 'publish' | 'detail_open' | 'detail_view' | 'manage_view',
    metadata?: Record<string, unknown>
  ) => {
    await apiClient.trackEventTelemetry(eventId, eventType, metadata);
  };

  const getCacheSnapshot = async () => {
    const cache = await refreshPublishedEvents();
    return {
      ...cache,
      drafts: await readDrafts(),
    };
  };

  return {
    getUserRecords,
    getOrganizerEvents,
    getOrganizerSummary,
    getMyEvents,
    getEventById,
    getDraftEventById,
    getResumeResolution,
    getEventAnalytics,
    trackEventTelemetry,
    createDraftEvent,
    upsertDraftEvent,
    deleteDraftEvent,
    publishDraftEvent,
    getPublicGoListItems,
    getPublicGoMapItems,
    getPublishedGoEvents,
    getOrganizerPublishedEvents,
    refreshPublishedEvents,
    invalidatePublishedCache,
    getCacheSnapshot,
  };
};

export const connectPortalStorage = createConnectPortalStorage();

export const {
  getUserRecords: getStoredConnectPortalEvents,
  getOrganizerEvents: getConnectPortalOrganizerEvents,
  getOrganizerSummary: getConnectPortalOrganizerSummary,
  getMyEvents: getConnectPortalMyEvents,
  getEventById: getConnectPortalEventById,
  getDraftEventById: getConnectPortalDraftById,
  getResumeResolution: getConnectPortalResumeResolution,
  getEventAnalytics: getConnectPortalEventAnalytics,
  trackEventTelemetry: trackConnectPortalEventTelemetry,
  createDraftEvent: createConnectPortalDraft,
  upsertDraftEvent: saveConnectPortalDraft,
  deleteDraftEvent: deleteConnectPortalDraft,
  publishDraftEvent: publishConnectPortalDraft,
  getPublicGoListItems: getConnectPortalPublicGoListItems,
  getPublicGoMapItems: getConnectPortalPublicGoMapItems,
  getPublishedGoEvents: getConnectPortalPublishedGoEvents,
  getOrganizerPublishedEvents: getConnectPortalOrganizerPublishedEvents,
  refreshPublishedEvents: refreshConnectPortalPublishedEvents,
  invalidatePublishedCache: invalidateConnectPortalPublishedEvents,
  getCacheSnapshot: getConnectPortalCacheSnapshot,
} = connectPortalStorage;

const normalizeServeJobStatus = (value: unknown): ConnectServeJobRecord['status'] =>
  value === 'published' ? 'published' : 'draft';

const normalizeServeJobVisibility = (value: unknown): ConnectServeJobRecord['visibility'] =>
  value === 'private' ? 'private' : 'public';

const normalizeServeJobHiringStatus = (value: unknown): ConnectServeJobRecord['hiringStatus'] =>
  value === 'closed' ? 'closed' : 'open';

const normalizeServeJobCompensationFrequency = (
  value: unknown
): ConnectServeJobCompensationFrequency => {
  if (
    value === 'per_hour' ||
    value === 'per_week' ||
    value === 'per_month' ||
    value === 'per_year'
  ) {
    return value;
  }

  return '';
};

const normalizeServeJobRecord = (value: unknown): ConnectServeJobRecord | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<ConnectServeJobRecord> & {
    coordinate?: Coordinate;
  };
  let id = '';
  if (typeof item.id === 'string') {
    id = item.id;
  } else if (typeof (item as any)._id === 'string') {
    id = (item as any)._id;
  }

  if (!id) {
    return null;
  }

  let lastCompletedStep: ConnectServeJobRecord['lastCompletedStep'] = 0;
  if (item.lastCompletedStep === 2) {
    lastCompletedStep = 2;
  } else if (item.lastCompletedStep === 1) {
    lastCompletedStep = 1;
  }

  const baseRecord = {
    id,
    status: normalizeServeJobStatus(item.status),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : undefined,
    visibility: normalizeServeJobVisibility(item.visibility),
    hiringStatus: normalizeServeJobHiringStatus(item.hiringStatus),
    lastCompletedStep,
    sector: String(item.sector || ''),
    title: String(item.title || ''),
    description: String(item.description || ''),
    requirements: Array.isArray(item.requirements)
      ? item.requirements.map((entry) => String(entry)).filter(Boolean)
      : [],
    address: String(item.address || ''),
    coordinate: normalizeCoordinate(item.coordinate),
    locationQuery: String(item.locationQuery || ''),
    opportunityType: String(item.opportunityType || ''),
    compensationAmount: String(item.compensationAmount || ''),
    compensationFrequency: normalizeServeJobCompensationFrequency(item.compensationFrequency),
    applicationUrl: String(item.applicationUrl || ''),
    organizationName: String(item.organizationName || ''),
    denomination: String(item.denomination || ''),
    applicantCount: Number(item.applicantCount || 0),
  } satisfies ConnectServeJobRecord;

  if (baseRecord.status === 'published') {
    return baseRecord as ConnectServeJobPublished;
  }

  return baseRecord as ConnectServeJobDraft;
};

const normalizeServeJobRecords = (value: unknown): ConnectServeJobRecord[] =>
  Array.isArray(value)
    ? (value.map(normalizeServeJobRecord).filter(Boolean) as ConnectServeJobRecord[])
    : [];

const sortServeJobsByUpdatedDesc = <T extends { updatedAt: string }>(items: T[]) =>
  [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

export const parseConnectServeRequirements = (value: string): string[] =>
  value
    .split('\n')
    .map((entry) => entry.replace(/^[\s•*-]+/, '').trim())
    .filter(Boolean);

export const formatConnectServeRequirementsText = (requirements: string[]): string =>
  requirements.join('\n');

export const listConnectServePublicJobs = async (): Promise<ConnectServeJobPublished[]> => {
  const result = await ApiCall<any[]>({
    route: 'connect/jobs/public',
    verb: 'get',
    suppressErrorLog: true,
  });

  if (result.status >= 400) {
    throw new Error('Unable to load Connect serve jobs');
  }

  return normalizeServeJobRecords(result.response).filter(
    (record): record is ConnectServeJobPublished => record.status === 'published'
  );
};

export const listConnectServeOrganizerJobs = async (): Promise<ConnectServeJobRecord[]> => {
  const result = await ApiCall<any[]>({
    route: 'connect/jobs/mine',
    verb: 'get',
    token: true,
    suppressErrorLog: true,
  });

  if (result.status >= 400) {
    throw new Error('Unable to load your serve jobs');
  }

  return sortServeJobsByUpdatedDesc(normalizeServeJobRecords(result.response));
};

export const getConnectServeJobById = async (
  jobId: string
): Promise<ConnectServeJobRecord | null> => {
  const result = await ApiCall<any>({
    route: `connect/jobs/${jobId}`,
    verb: 'get',
    token: true,
    suppressErrorLog: true,
  });

  if (result.status >= 400) {
    return null;
  }

  return normalizeServeJobRecord(result.response);
};

const trimStringOrUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const buildConnectServeJobDraftCreateParams = (overrides?: Partial<ConnectServeJobDraft>) => {
  const params: Partial<ConnectServeJobDraft> = {};

  if (overrides?.visibility === 'public' || overrides?.visibility === 'private') {
    params.visibility = overrides.visibility;
  }

  if (overrides?.hiringStatus === 'open' || overrides?.hiringStatus === 'closed') {
    params.hiringStatus = overrides.hiringStatus;
  }

  return params;
};

const buildConnectServeJobDraftUpdateParams = (updates: Partial<ConnectServeJobDraft>) => {
  const params: Record<string, unknown> = {};

  if (updates.visibility === 'public' || updates.visibility === 'private') {
    params.visibility = updates.visibility;
  }

  if (updates.hiringStatus === 'open' || updates.hiringStatus === 'closed') {
    params.hiringStatus = updates.hiringStatus;
  }

  if (updates.sector !== undefined) {
    params.sector = String(updates.sector).trim();
  }

  if (updates.title !== undefined) {
    params.title = String(updates.title).trim();
  }

  if (updates.description !== undefined) {
    params.description = String(updates.description).trim();
  }

  if (updates.requirements !== undefined) {
    params.requirements = updates.requirements
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
      .slice(0, 50);
  }

  if (updates.address !== undefined) {
    params.address = String(updates.address).trim();
  }

  if (updates.locationQuery !== undefined) {
    params.locationQuery = String(updates.locationQuery).trim();
  }

  if (updates.coordinate !== undefined) {
    const normalizedCoordinate = normalizeCoordinate(updates.coordinate);
    if (normalizedCoordinate) {
      params.coordinate = normalizedCoordinate;
    }
  }

  if (updates.opportunityType !== undefined) {
    params.opportunityType = String(updates.opportunityType).trim();
  }

  if (updates.compensationAmount !== undefined) {
    params.compensationAmount = trimStringOrUndefined(updates.compensationAmount);
  }

  if (
    updates.compensationFrequency === 'per_hour' ||
    updates.compensationFrequency === 'per_week' ||
    updates.compensationFrequency === 'per_month' ||
    updates.compensationFrequency === 'per_year'
  ) {
    params.compensationFrequency = updates.compensationFrequency;
  }

  if (updates.applicationUrl !== undefined) {
    const applicationUrl = trimStringOrUndefined(updates.applicationUrl);
    if (applicationUrl !== undefined) {
      params.applicationUrl = applicationUrl;
    }
  }

  if (updates.lastCompletedStep !== undefined) {
    params.lastCompletedStep = Math.max(0, Math.min(2, Number(updates.lastCompletedStep) || 0));
  }

  return params;
};

export const createConnectServeJobDraft = async (
  overrides?: Partial<ConnectServeJobDraft>
): Promise<ConnectServeJobDraft> => {
  const result = await ApiCall<any>({
    route: 'connect/jobs/drafts',
    verb: 'post',
    token: true,
    params: buildConnectServeJobDraftCreateParams(overrides),
    suppressErrorLog: true,
  });

  if (result.status >= 400) {
    throw new Error((result.response as any)?.message || 'Unable to create job draft');
  }

  const draft = normalizeServeJobRecord(result.response);
  if (!draft || draft.status !== 'draft') {
    throw new Error('Unable to create job draft');
  }

  return draft;
};

export const getConnectServeJobDraftById = async (
  draftId: string
): Promise<ConnectServeJobDraft | null> => {
  const result = await ApiCall<any>({
    route: `connect/jobs/drafts/${draftId}`,
    verb: 'get',
    token: true,
    suppressErrorLog: true,
  });

  if (result.status >= 400) {
    return null;
  }

  const draft = normalizeServeJobRecord(result.response);
  return draft && draft.status === 'draft' ? draft : null;
};

export const saveConnectServeJobDraft = async (
  draftId: string,
  updates: Partial<ConnectServeJobDraft>
): Promise<ConnectServeJobDraft> => {
  const result = await ApiCall<any>({
    route: `connect/jobs/drafts/${draftId}`,
    verb: 'patch',
    token: true,
    params: buildConnectServeJobDraftUpdateParams(updates),
    suppressErrorLog: true,
  });

  if (result.status >= 400) {
    throw new Error((result.response as any)?.message || 'Unable to save job draft');
  }

  const draft = normalizeServeJobRecord(result.response);
  if (!draft || draft.status !== 'draft') {
    throw new Error('Unable to save job draft');
  }

  return draft;
};

export const publishConnectServeJobDraft = async (
  draftId: string
): Promise<ConnectServeJobPublished> => {
  const result = await ApiCall<any>({
    route: 'connect/jobs/publish',
    verb: 'post',
    token: true,
    params: { draftId },
    suppressErrorLog: true,
  });

  if (result.status >= 400) {
    throw new Error((result.response as any)?.message || 'Unable to publish job');
  }

  const publishedRecord = normalizeServeJobRecord(result.response);
  if (!publishedRecord || publishedRecord.status !== 'published') {
    throw new Error('Unable to publish job');
  }

  return publishedRecord;
};

export const getConnectServeResumeRouteName = (
  record: Pick<ConnectServeJobDraft, 'lastCompletedStep'>
) => (record.lastCompletedStep >= 1 ? 'ConnectServeCreateJobStep2' : 'ConnectServeCreateJobStep1');

export const getConnectServeCompensationLabel = (
  amount: string,
  frequency: ConnectServeJobCompensationFrequency
) => {
  const trimmedAmount = String(amount || '').trim();
  if (!trimmedAmount) {
    return 'Compensation TBD';
  }

  const numericAmount = Number(trimmedAmount);
  const formattedAmount = Number.isFinite(numericAmount)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(numericAmount)
    : trimmedAmount;

  let suffix = '';
  if (frequency === 'per_hour') {
    suffix = ' / hour';
  } else if (frequency === 'per_week') {
    suffix = ' / week';
  } else if (frequency === 'per_month') {
    suffix = ' / month';
  } else if (frequency === 'per_year') {
    suffix = ' / year';
  }

  return `${formattedAmount}${suffix}`;
};

const normalizePlaceRecord = (value: unknown): ConnectPlaceRecord | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<ConnectPlaceRecord> & {
    coordinate?: Coordinate;
  };
  let id = '';
  if (typeof item.id === 'string') {
    id = item.id;
  } else if (typeof (item as any)._id === 'string') {
    id = (item as any)._id;
  }

  if (!id) {
    return null;
  }

  return {
    id,
    title: String(item.title || ''),
    avatarUri: typeof item.avatarUri === 'string' ? item.avatarUri : undefined,
    organizationTypeLabel: String(item.organizationTypeLabel || ''),
    churchTypeLabel: String(item.churchTypeLabel || ''),
    organizationSize:
      typeof item.organizationSize === 'string'
        ? (item.organizationSize as ConnectPlaceRecord['organizationSize'])
        : undefined,
    address: String(item.address || ''),
    coordinate: normalizeCoordinate(item.coordinate),
    distanceMiles: typeof item.distanceMiles === 'number' ? item.distanceMiles : undefined,
    distanceLabel: String(item.distanceLabel || ''),
    metadataTags: Array.isArray(item.metadataTags)
      ? item.metadataTags.map((tag) => String(tag))
      : [],
    isActive: item.isActive !== false,
    isOpen: item.isOpen !== false,
    followerCount: typeof item.followerCount === 'number' ? item.followerCount : undefined,
  };
};

const normalizePlacesResponse = (value: unknown): ConnectPlacesResponse | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<ConnectPlacesResponse> & { data?: unknown[] };
  const data = Array.isArray(item.data)
    ? (item.data.map(normalizePlaceRecord).filter(Boolean) as ConnectPlaceRecord[])
    : [];

  return {
    data,
    total: Number(item.total || data.length || 0),
    page: Number(item.page || 1),
    limit: Number(item.limit || data.length || 0),
    hasMore: item.hasMore === true,
  };
};

const buildPlacesQueryString = (params: Record<string, string | number | undefined>) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
};

export const getDefaultConnectPlaceFilters = (
  overrides: Partial<ConnectPlaceFilters> = {}
): ConnectPlaceFilters => ({
  organizationTypeIds: [],
  churchType: '',
  organizationSize: undefined,
  locationAddress: '',
  lat: undefined,
  lon: undefined,
  radiusMiles: 50,
  sort: 'nearby',
  ...overrides,
});

export const listConnectPortalPlaces = async (
  filters: ConnectPlaceFilters,
  options?: {
    text?: string;
    page?: number;
    limit?: number;
    view?: ConnectViewMode;
  }
): Promise<ConnectPlacesResponse> => {
  const query = buildPlacesQueryString({
    text: options?.text,
    page: options?.page ?? 1,
    limit: options?.limit ?? 50,
    view: options?.view,
    sort: filters.sort,
    organizationTypeIds:
      filters.organizationTypeIds.length > 0 ? filters.organizationTypeIds.join(',') : undefined,
    churchType: filters.churchType || undefined,
    organizationSize: filters.organizationSize || undefined,
    locationAddress: filters.locationAddress || undefined,
    lat: filters.lat,
    lon: filters.lon,
    radiusMiles: filters.radiusMiles,
  });

  try {
    const result = await ApiCall<any>({
      route: `connect/organizations/public${query}`,
      verb: 'get',
      token: true,
      suppressErrorLog: true,
    });

    if (result.status >= 400) {
      throw new Error('Unable to load Connect places');
    }

    return (
      normalizePlacesResponse(result.response) || {
        data: [],
        total: 0,
        page: 1,
        limit: 0,
        hasMore: false,
      }
    );
  } catch {
    return {
      data: SEEDED_CONNECT_PLACES,
      total: SEEDED_CONNECT_PLACES.length,
      page: 1,
      limit: SEEDED_CONNECT_PLACES.length,
      hasMore: false,
    };
  }
};

export const getConnectPortalPlaceFilterOptions = async (): Promise<{
  organizationTypes: ConnectPlaceFilterOption[];
  churchTypes: ConnectPlaceFilterOption[];
  sortOptions: ConnectPlaceFilterOption[];
}> => {
  const sortOptions: ConnectPlaceFilterOption[] = [
    { label: 'Nearby', value: 'nearby' },
    { label: 'Alphabetical', value: 'alphabetical' },
    { label: 'Recently Active', value: 'recently_active' },
  ];

  try {
    const [organizationTypeResult, churchTypeResult] = await Promise.all([
      ApiCall<any[]>({
        route: 'global/organization-type',
        verb: 'get',
        token: true,
        suppressErrorLog: true,
      }),
      ApiCall<any[]>({
        route: 'global/church-type',
        verb: 'get',
        token: true,
        suppressErrorLog: true,
      }),
    ]);

    const organizationTypes = Array.isArray(organizationTypeResult.response)
      ? organizationTypeResult.response
          .map((item) => ({
            label: String(item?.organizationType || item?.name || '').trim(),
            value: String(item?._id || ''),
          }))
          .filter((item) => item.label.length > 0 && item.value.length > 0)
      : [];

    const churchTypes = Array.isArray(churchTypeResult.response)
      ? churchTypeResult.response
          .map((item) => ({
            label: String(item?.churchType || '').trim(),
            value: String(item?.churchType || '').trim(),
          }))
          .filter((item) => item.label.length > 0)
      : [];

    return { organizationTypes, churchTypes, sortOptions };
  } catch {
    return { organizationTypes: [], churchTypes: [], sortOptions };
  }
};

export const getConnectEventTypeOptions = async (): Promise<ConnectPlaceFilterOption[]> => {
  try {
    const result = await ApiCall<any[]>({
      route: 'global/connect-event-type',
      verb: 'get',
      token: true,
      suppressErrorLog: true,
    });
    return Array.isArray(result.response)
      ? result.response
          .map((item) => ({
            label: String(item?.name || '').trim(),
            value: String(item?.name || '').trim(),
          }))
          .filter((item) => item.label.length > 0)
      : [];
  } catch {
    return [];
  }
};

export const getConnectServeRoleOptions = async (): Promise<ConnectPlaceFilterOption[]> => {
  try {
    const result = await ApiCall<any[]>({
      route: 'global/connect-serve-role',
      verb: 'get',
      token: true,
      suppressErrorLog: true,
    });
    return Array.isArray(result.response)
      ? result.response
          .map((item) => ({
            label: String(item?.name || '').trim(),
            value: String(item?.name || '').trim(),
          }))
          .filter((item) => item.label.length > 0)
      : [];
  } catch {
    return [];
  }
};

export const submitConnectEventTypeSuggestion = async (name: string): Promise<void> => {
  try {
    await ApiCall({
      route: 'global/connect-event-type/suggest',
      verb: 'post',
      token: true,
      params: { name },
      suppressErrorLog: true,
    });
  } catch {
    // Fire-and-forget; suggestion tracking is best-effort
  }
};

export const getEventCapacityLabel = (record: ConnectPortalEventRecordBase) => {
  const capacityValue = getCapacityValue(record);
  if (!capacityValue) {
    return `${record.registrationCount} registered`;
  }
  return `${record.registrationCount} / ${capacityValue}`;
};

export const getEventProgressRatio = (record: ConnectPortalEventRecordBase) => {
  const capacityValue = getCapacityValue(record);
  if (!capacityValue) {
    return 0;
  }
  return Math.max(0, Math.min(1, record.registrationCount / capacityValue));
};

export const getEventLifecycleState = (
  record: ConnectPortalEventRecord,
  nowIso = new Date().toISOString()
) => getLifecycleFilter(record, nowIso);

export const formatConnectPortalCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export const formatConnectPortalNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(Number(value || 0));

export const formatConnectPortalPercent = (value: number) =>
  `${Math.round(Math.max(0, Math.min(1, Number(value || 0))) * 100)}%`;

export const formatConnectPortalDate = formatDateLabel;

export const formatConnectPortalDateTime = formatDateTimeLabel;

export type {
  ConnectGoFilters,
  ConnectGoQuickChip,
  ConnectGoSort,
  ConnectPlaceFilterOption,
  ConnectPlaceFilters,
  ConnectPlaceRecord,
  ConnectPlacesQuickChip,
  ConnectPlacesResponse,
  ConnectPlaceSort,
  ConnectPortalAnalyticsResponse,
  ConnectPortalAnalyticsSummary,
  ConnectPortalCacheSnapshot,
  ConnectPortalCreateStep,
  ConnectPortalEventDraft,
  ConnectPortalEventRecord,
  ConnectPortalMyEventsFilter,
  ConnectPortalOrganizerSummary,
  ConnectPortalPaymentOption,
  ConnectPortalPublishedEvent,
  ConnectPortalResumeResolution,
  ConnectPortalTicketType,
  ConnectPortalTelemetryActivityItem,
  ConnectQuickChip,
  ConnectServeJobCompensationFrequency,
  ConnectServeJobDraft,
  ConnectServeFilters,
  ConnectServeJobPublished,
  ConnectServeJobRecord,
  ConnectServeJobHiringStatus,
  ConnectServeQuickChip,
  ConnectServeSort,
  ConnectServeJobVisibility,
  ConnectViewMode,
  TicketTier,
} from './types';
