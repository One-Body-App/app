import type { Coordinate } from '@/src/screens/connectportal/data';

export type ConnectPortalCreateStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ConnectPortalTicketType = 'free' | 'paid';

export type ConnectPortalPaymentOption = 'external' | 'internal';

export type ConnectPortalMyEventsFilter = 'All' | 'Active' | 'Draft' | 'Past';

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
  isOnline: boolean;
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

export type ConnectPortalResumeResolution =
  | {
      kind: 'draft';
      draft: ConnectPortalEventDraft;
    }
  | {
      kind: 'missing';
      message: string;
    };
