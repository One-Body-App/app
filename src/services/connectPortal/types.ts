import type { Coordinate } from '@/src/screens/connectportal/data';
import type { OrganizationSize } from '@/utils/types';

export type ConnectPortalCreateStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ConnectPortalTicketType = 'free' | 'external' | 'paid';

export type ConnectPortalPaymentOption = 'external' | 'internal';

export type ConnectPortalMyEventsFilter = 'All' | 'Active' | 'Draft' | 'Past';

export type ConnectViewMode = 'list' | 'map';

export type ConnectPlaceSort = 'nearby' | 'alphabetical' | 'recently_active';

export type ConnectPlacesQuickChip = 'Nearby' | 'Non-Profits' | 'Churches' | 'Mega-Church';

export type ConnectGoSort = 'upcoming' | 'alphabetical' | 'recently_updated';

export type ConnectGoQuickChip = 'Upcoming' | 'Online' | 'In Person' | 'Live';

export type ConnectServeSort = 'alphabetical' | 'role_type' | 'nearest_match';

export type ConnectServeQuickChip = 'Hiring' | 'Part-time' | 'Full-time' | 'Serve';

export type ConnectQuickChip = ConnectPlacesQuickChip | ConnectGoQuickChip | ConnectServeQuickChip;

export type ConnectPlaceFilters = {
  organizationTypeIds: string[];
  churchType: string;
  organizationSize?: OrganizationSize;
  locationAddress: string;
  lat?: number;
  lon?: number;
  radiusMiles: number;
  sort: ConnectPlaceSort;
};

export type ConnectGoFilters = {
  sort: ConnectGoSort;
  eventType: string;
  category: string;
  mode: '' | 'online' | 'in_person';
};

export type ConnectServeFilters = {
  sort: ConnectServeSort;
  roleType: string;
  tag: string;
};

export type ConnectPlaceRecord = {
  id: string;
  title: string;
  avatarUri?: string;
  organizationTypeLabel: string;
  churchTypeLabel: string;
  organizationSize?: OrganizationSize;
  address: string;
  coordinate?: Coordinate;
  distanceMiles?: number;
  distanceLabel: string;
  metadataTags: string[];
  isActive: boolean;
  isOpen?: boolean;
  followerCount?: number;
};

export type ConnectPlacesResponse = {
  data: ConnectPlaceRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type ConnectPlaceFilterOption = {
  label: string;
  value: string;
};

export type TicketTier = {
  id: string;
  name: string;
  quantity: string;
  price: string;
};

export type ConnectPortalEventRecordBase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  eventType: string;
  category: string;
  photoUri?: string;
  heroImageUri?: string;
  organizerName: string;
  organizerRole: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isSingleDayEvent: boolean;
  isOnline: boolean;
  onlineEventUrl: string;
  externalEventUrl: string;
  locationQuery: string;
  venueName: string;
  address: string;
  coordinate?: Coordinate;
  description: string;
  capacity: string;
  ticketType: ConnectPortalTicketType;
  paymentOption: ConnectPortalPaymentOption;
  payoutConfigured: boolean;
  ticketTiers: TicketTier[];
  businessName: string;
  ein: string;
  registrationCount: number;
  viewCount: number;
  openCount: number;
  tags: string[];
};

export type ConnectPortalEventDraft = ConnectPortalEventRecordBase & {
  status: 'draft';
  lastCompletedStep: ConnectPortalCreateStep;
  publishedEventId?: string;
};

export type ConnectPortalPublishedEvent = ConnectPortalEventRecordBase & {
  status: 'published';
  publishedAt: string;
  ownerUserId?: string;
  isLive?: boolean;
};

export type ConnectPortalEventRecord = ConnectPortalEventDraft | ConnectPortalPublishedEvent;

export type ConnectPortalOrganizerSummary = {
  featuredEvent: ConnectPortalPublishedEvent | null;
  activeEvents: ConnectPortalPublishedEvent[];
  draftEvents: ConnectPortalEventDraft[];
  allEvents: ConnectPortalEventRecord[];
  totalRegistrations: number;
  totalViews: number;
  totalOpens: number;
};

export type ConnectPortalCacheSnapshot = {
  drafts: ConnectPortalEventDraft[];
  organizerPublished: ConnectPortalPublishedEvent[];
  publicPublished: ConnectPortalPublishedEvent[];
  loadedAt: number | null;
};

export type ConnectServeJobVisibility = 'public' | 'private';

export type ConnectServeJobHiringStatus = 'open' | 'closed';

export type ConnectServeJobCompensationFrequency =
  | 'per_hour'
  | 'per_week'
  | 'per_month'
  | 'per_year'
  | '';

export type ConnectServeJobRecordBase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  visibility: ConnectServeJobVisibility;
  hiringStatus: ConnectServeJobHiringStatus;
  lastCompletedStep: 0 | 1 | 2;
  sector: string;
  title: string;
  description: string;
  requirements: string[];
  address: string;
  coordinate?: Coordinate;
  locationQuery: string;
  opportunityType: string;
  compensationAmount: string;
  compensationFrequency: ConnectServeJobCompensationFrequency;
  applicationUrl: string;
  organizationName: string;
  denomination: string;
  applicantCount: number;
};

export type ConnectServeJobDraft = ConnectServeJobRecordBase & {
  status: 'draft';
};

export type ConnectServeJobPublished = ConnectServeJobRecordBase & {
  status: 'published';
};

export type ConnectServeJobRecord = ConnectServeJobDraft | ConnectServeJobPublished;

export type ConnectPortalResumeResolution =
  | {
      kind: 'draft';
      draft: ConnectPortalEventDraft;
    }
  | {
      kind: 'missing';
      message: string;
    };

export type ConnectPortalTelemetryActivityItem = {
  id: string;
  eventType: 'publish' | 'detail_open' | 'detail_view' | 'manage_view';
  timestamp: string;
  metadata: Record<string, unknown> | null;
};

export type ConnectPortalAnalyticsSummary = {
  totalEvents: number;
  openCount: number;
  viewCount: number;
  manageViewCount: number;
  registrationCount: number;
  conversionRate: number;
};

export type ConnectPortalAnalyticsResponse = {
  event: ConnectPortalPublishedEvent;
  summary: ConnectPortalAnalyticsSummary;
  recentActivity: ConnectPortalTelemetryActivityItem[];
};
