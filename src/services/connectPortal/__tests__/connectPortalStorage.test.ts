import type { ConnectPortalEventRecord } from '../types';
import { createConnectPortalStorage, getDraftResumeRouteName } from '../index';

const createMemoryStorage = (seed?: ConnectPortalEventRecord[]) => {
  const values = new Map<string, string>();
  if (seed) {
    values.set('@onebody/connect-portal/drafts.v2', JSON.stringify(seed));
  }

  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
};

const createApiClient = (overrides?: Partial<any>) => {
  const publishedEvents: any[] = [];

  const apiClient = {
    listPublicEvents: jest.fn(async () => publishedEvents),
    listOrganizerEvents: jest.fn(async () => publishedEvents),
    getEvent: jest.fn(
      async (eventId) => publishedEvents.find((item) => item.id === eventId) || null
    ),
    getEventAnalytics: jest.fn(async () => null),
    publishEvent: jest.fn(async (payload) => {
      const publishedEvent = {
        id: payload.eventId || 'published-1',
        status: 'published',
        createdAt: '2026-03-14T12:00:00.000Z',
        updatedAt: '2026-03-14T12:00:00.000Z',
        publishedAt: '2026-03-14T12:00:00.000Z',
        title: payload.title || 'Published Event',
        eventType: payload.eventType || 'Event',
        category: payload.category || 'EVENT',
        organizerName: payload.organizerName || 'You',
        organizerRole: payload.organizerRole || 'Event Organizer',
        startDate: payload.startDate || '2026-05-01',
        endDate: payload.endDate || '2026-05-01',
        startTime: payload.startTime || '7:00 PM',
        endTime: payload.endTime || '',
        isOnline: false,
        externalEventUrl: payload.externalEventUrl || '',
        locationQuery: '',
        venueName: payload.venueName || 'Venue',
        address: payload.address || 'Address',
        coordinate: payload.coordinate || [-84.4, 33.7],
        description: payload.description || '',
        capacity: payload.capacity ? String(payload.capacity) : '',
        ticketType: payload.ticketType || 'free',
        paymentOption: payload.paymentOption || 'external',
        payoutConfigured: payload.payoutConfigured === true,
        ticketTiers: payload.ticketTiers || [],
        businessName: payload.businessName || '',
        ein: payload.ein || '',
        registrationCount: Number(payload.registrationCount || 0),
        viewCount: 0,
        openCount: 0,
        tags: ['Event', 'Live'],
      };
      publishedEvents.splice(0, publishedEvents.length, publishedEvent);
      return publishedEvent;
    }),
    trackEventTelemetry: jest.fn(async () => undefined),
  };

  return {
    ...apiClient,
    ...overrides,
  };
};

describe('connectPortalStorage', () => {
  it('creates and persists multiple drafts', async () => {
    const storage = createMemoryStorage();
    const api = createConnectPortalStorage({
      storage,
      apiClient: createApiClient() as any,
      now: jest.fn().mockReturnValue('2026-03-14T12:00:00.000Z'),
      createId: jest.fn().mockReturnValueOnce('draft-1').mockReturnValueOnce('draft-2'),
    });

    await api.createDraftEvent({ title: 'First Draft' });
    await api.createDraftEvent({ title: 'Second Draft' });

    const records = await api.getUserRecords();
    expect(records).toHaveLength(2);
    expect(records.map((record) => record.id)).toEqual(['draft-2', 'draft-1']);
  });

  it('resumes drafts from the last incomplete step and payout branch', async () => {
    const storage = createMemoryStorage();
    const api = createConnectPortalStorage({
      storage,
      apiClient: createApiClient() as any,
      now: jest.fn().mockReturnValue('2026-03-14T12:00:00.000Z'),
      createId: jest.fn().mockReturnValue('draft-1'),
    });

    const draft = await api.createDraftEvent({
      title: 'Paid Event',
      ticketType: 'paid',
      paymentOption: 'internal',
    });

    const savedDraft = await api.upsertDraftEvent(
      draft.id,
      { title: 'Paid Event', ticketType: 'paid', paymentOption: 'internal' },
      { completedStep: 5 }
    );
    if (!savedDraft) {
      throw new Error('Expected saved draft');
    }

    expect(getDraftResumeRouteName(savedDraft)).toBe('ConnectGoCreateStep6Payout');

    const payoutCompleteDraft = await api.upsertDraftEvent(
      draft.id,
      { businessName: 'OneBody Events LLC', ein: '12-3456789' },
      { markPayoutConfigured: true }
    );
    if (!payoutCompleteDraft) {
      throw new Error('Expected payout-complete draft');
    }

    expect(getDraftResumeRouteName(payoutCompleteDraft)).toBe('ConnectGoCreateStep6Review');
  });

  it('publishes drafts and exposes them in public Go selectors', async () => {
    const storage = createMemoryStorage();
    const apiClient = createApiClient();
    const api = createConnectPortalStorage({
      storage,
      apiClient: apiClient as any,
      now: jest.fn().mockReturnValue('2026-03-14T12:00:00.000Z'),
      createId: jest.fn().mockReturnValue('draft-1'),
    });

    const draft = await api.createDraftEvent({
      title: 'Neighborhood Prayer Night',
      startDate: '2026-05-01',
      startTime: '7:00 PM',
      venueName: 'Westside Chapel',
      address: '77 Joseph E Lowery Blvd, Atlanta, GA',
      coordinate: [-84.412, 33.755],
      ticketType: 'free',
      paymentOption: 'external',
      externalEventUrl: '',
    });

    const publishedRecord = await api.publishDraftEvent(draft.id);

    const userRecords = await api.getUserRecords();
    expect(userRecords).toHaveLength(0);
    expect(apiClient.publishEvent).toHaveBeenCalled();
    expect(publishedRecord?.id).toBe('published-1');

    const publicListItems = await api.getPublicGoListItems();
    expect(publicListItems.some((item) => item.id === publishedRecord?.id)).toBe(true);

    const publicMapItems = await api.getPublicGoMapItems();
    expect(publicMapItems.some((item) => item.id === publishedRecord?.id)).toBe(true);
  });

  it('round-trips external-link drafts and resumes them at review', async () => {
    const storage = createMemoryStorage();
    const api = createConnectPortalStorage({
      storage,
      apiClient: createApiClient() as any,
      now: jest.fn().mockReturnValue('2026-03-14T12:00:00.000Z'),
      createId: jest.fn().mockReturnValue('draft-external'),
    });

    const draft = await api.createDraftEvent({
      title: 'Conference Registration',
      ticketType: 'external',
      paymentOption: 'external',
      externalEventUrl: 'https://example.com/register',
    });

    const savedDraft = await api.upsertDraftEvent(
      draft.id,
      {
        ticketType: 'external',
        paymentOption: 'external',
        externalEventUrl: 'https://example.com/register',
      },
      { completedStep: 4 }
    );

    if (!savedDraft) {
      throw new Error('Expected external-link draft');
    }

    expect(savedDraft.externalEventUrl).toBe('https://example.com/register');
    expect(getDraftResumeRouteName(savedDraft)).toBe('ConnectGoCreateStep6Review');
  });

  it('normalizes missing external link fields on older draft records', async () => {
    const storage = createMemoryStorage([
      {
        id: 'legacy-draft',
        status: 'draft',
        createdAt: '2026-03-14T12:00:00.000Z',
        updatedAt: '2026-03-14T12:00:00.000Z',
        lastCompletedStep: 4,
        title: 'Legacy Free Event',
        eventType: 'Event',
        category: 'EVENT',
        organizerName: 'You',
        organizerRole: 'Event Organizer',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        isSingleDayEvent: false,
        isOnline: false,
        onlineEventUrl: '',
        locationQuery: '',
        venueName: '',
        address: '',
        description: '',
        capacity: '',
        ticketType: 'free',
        paymentOption: 'external',
        payoutConfigured: false,
        ticketTiers: [],
        businessName: '',
        ein: '',
        registrationCount: 0,
        viewCount: 0,
        openCount: 0,
        tags: ['Draft'],
      } as ConnectPortalEventRecord,
    ]);

    const api = createConnectPortalStorage({
      storage,
      apiClient: createApiClient() as any,
      now: jest.fn().mockReturnValue('2026-03-14T12:00:00.000Z'),
      createId: jest.fn().mockReturnValue('draft-1'),
    });

    const records = await api.getUserRecords();

    expect(records[0]?.externalEventUrl).toBe('');
  });

  it('keeps seeded public events out of organizer-owned results', async () => {
    const storage = createMemoryStorage();
    const api = createConnectPortalStorage({
      storage,
      apiClient: createApiClient() as any,
      now: jest.fn().mockReturnValue('2026-03-14T12:00:00.000Z'),
      createId: jest.fn().mockReturnValue('draft-1'),
    });

    await api.createDraftEvent({ title: 'Fresh Draft' });

    const drafts = await api.getMyEvents('Draft');
    const active = await api.getMyEvents('Active');

    expect(drafts.some((record) => record.status === 'draft')).toBe(true);
    expect(active).toHaveLength(0);
  });

  it('returns a missing resume resolution instead of silently creating a draft', async () => {
    const storage = createMemoryStorage();
    const api = createConnectPortalStorage({
      storage,
      apiClient: createApiClient() as any,
      now: jest.fn().mockReturnValue('2026-03-14T12:00:00.000Z'),
      createId: jest.fn().mockReturnValue('draft-1'),
    });

    const resolution = await api.getResumeResolution('missing-draft');

    expect(resolution.kind).toBe('missing');
  });
});
