import React from 'react';
import { Alert, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import ReviewAndConfirmScreen from '../create.go.step6';

const mockEnsureExistingDraftRecord = jest.fn();
const mockPublishConnectPortalDraft = jest.fn();
const mockGetConnectPortalEventById = jest.fn();

let mockLatestLayoutProps: any;
const mockReact = React;
const MockView = View;

jest.mock('../shared', () => ({
  CreateFlowLayout: (props: any) => {
    mockLatestLayoutProps = props;
    return mockReact.createElement(MockView, null, props.children);
  },
  ensureExistingDraftRecord: (...args: unknown[]) => mockEnsureExistingDraftRecord(...args),
  getReviewBackRouteName: jest.fn(() => 'ConnectGoCreateStep5'),
  useCreateFlowPalette: jest.fn(() => ({
    textPrimary: '#e6eaec',
    textSecondary: '#9aacb1',
    accent: '#126b87',
    cardBg: '#181a1c',
    cardBorder: 'rgba(255,255,255,0.1)',
  })),
}));

jest.mock('@/src/hooks/useMountEffect', () => (callback: () => void) => callback());

jest.mock('@/src/services/connectPortal', () => ({
  formatConnectPortalDate: jest.fn(() => 'Apr 1, 2026'),
  getConnectPortalEventById: (...args: unknown[]) => mockGetConnectPortalEventById(...args),
  getEventCapacityLabel: jest.fn(() => '100 attendees'),
  publishConnectPortalDraft: (...args: unknown[]) => mockPublishConnectPortalDraft(...args),
}));

describe('ReviewAndConfirmScreen', () => {
  const draftRecord = {
    id: 'draft-1',
    status: 'draft',
    category: 'EVENT',
    title: "Hope Men's Retreat",
    description: 'Testing publish flow',
    startDate: '2026-04-01',
    startTime: '10:30 AM',
    endDate: '2026-04-01',
    endTime: '1:30 PM',
    isSingleDayEvent: true,
    isOnline: false,
    venueName: 'Hope Retreat',
    address: '3456 Taney Place',
    locationQuery: '',
    ticketType: 'free',
    paymentOption: 'external',
    ticketTiers: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLatestLayoutProps = null;
    mockEnsureExistingDraftRecord.mockResolvedValue(draftRecord);
    mockPublishConnectPortalDraft.mockResolvedValue({
      id: 'published-1',
    });
    mockGetConnectPortalEventById.mockResolvedValue(null);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads the draft through ensureExistingDraftRecord', async () => {
    const navigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
    };

    await act(async () => {
      TestRenderer.create(
        <ReviewAndConfirmScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-6',
              name: 'ConnectGoCreateStep6Review',
              params: { draftId: 'draft-1' },
            } as any
          }
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockEnsureExistingDraftRecord).toHaveBeenCalledWith(navigation, 'draft-1');
    expect(mockLatestLayoutProps.nextDisabled).toBe(false);
  });

  it('publishes the draft and navigates to success', async () => {
    const navigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
    };

    await act(async () => {
      TestRenderer.create(
        <ReviewAndConfirmScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-6',
              name: 'ConnectGoCreateStep6Review',
              params: { draftId: 'draft-1' },
            } as any
          }
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await mockLatestLayoutProps.onNext();
    });

    expect(mockPublishConnectPortalDraft).toHaveBeenCalledWith('draft-1');
    expect(navigation.replace).toHaveBeenCalledWith('ConnectGoCreateStep7Success', {
      draftId: 'published-1',
    });
  });

  it('shows an alert and stays on the screen when publish fails', async () => {
    mockPublishConnectPortalDraft.mockRejectedValue(new Error('title is required'));

    const navigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
    };

    await act(async () => {
      TestRenderer.create(
        <ReviewAndConfirmScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-6',
              name: 'ConnectGoCreateStep6Review',
              params: { draftId: 'draft-1' },
            } as any
          }
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await mockLatestLayoutProps.onNext();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Unable to publish event', 'title is required');
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('does not publish twice while a publish request is in flight', async () => {
    let resolvePublish: ((value: { id: string }) => void) | undefined;
    mockPublishConnectPortalDraft.mockImplementation(
      () =>
        new Promise<{ id: string }>((resolve) => {
          resolvePublish = resolve;
        })
    );

    const navigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
    };

    await act(async () => {
      TestRenderer.create(
        <ReviewAndConfirmScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-6',
              name: 'ConnectGoCreateStep6Review',
              params: { draftId: 'draft-1' },
            } as any
          }
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    let firstPublish!: Promise<void>;
    await act(async () => {
      firstPublish = mockLatestLayoutProps.onNext();
      await Promise.resolve();
    });

    expect(mockLatestLayoutProps.nextDisabled).toBe(true);

    await act(async () => {
      await mockLatestLayoutProps.onNext();
    });

    expect(mockPublishConnectPortalDraft).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePublish?.({ id: 'published-1' });
      await firstPublish;
    });

    expect(navigation.replace).toHaveBeenCalledWith('ConnectGoCreateStep7Success', {
      draftId: 'published-1',
    });
  });
});
