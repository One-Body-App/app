import React from 'react';
import { StyleSheet, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import EventViewScreen from '../eventview';

const mockGetConnectPortalEventById = jest.fn();
const mockGetDraftResumeRouteName = jest.fn(() => 'ConnectGoCreateStep6Review');
const mockTrackConnectPortalEventTelemetry = jest.fn(() => Promise.resolve());
let mockMountEffectHasRun = false;
const mockSetConnectPortalEventGoing = jest.fn(() =>
  Promise.resolve({
    event: null,
    isGoing: true,
    registrationCount: 5,
    changed: true,
  })
);
const mockFormatConnectPortalDate = jest.fn((value: string) => {
  const dateMap: Record<string, string> = {
    '2026-04-01': 'Apr 1, 2026',
    '2026-04-02': 'Apr 2, 2026',
  };

  return dateMap[value] || value;
});

jest.mock('@react-native-vector-icons/ionicons', () => 'Ionicons');
jest.mock('expo-image', () => {
  const ReactNative = jest.requireActual('react-native');

  return {
    ImageBackground: ReactNative.ImageBackground,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 28,
    bottom: 14,
    left: 0,
    right: 0,
  })),
}));

jest.mock('@/src/services/connectPortal', () => ({
  formatConnectPortalDate: (value: string) => mockFormatConnectPortalDate(value),
  formatConnectPortalNumber: (value: number) => String(value),
  getConnectPortalEventById: (...args: unknown[]) => mockGetConnectPortalEventById(...args),
  getDraftResumeRouteName: (...args: unknown[]) => mockGetDraftResumeRouteName(...args),
  setConnectPortalEventGoing: (...args: unknown[]) => mockSetConnectPortalEventGoing(...args),
  trackConnectPortalEventTelemetry: (...args: unknown[]) =>
    mockTrackConnectPortalEventTelemetry(...args),
}));

jest.mock('@/src/hooks/useMountEffect', () => (callback: () => void) => {
  if (mockMountEffectHasRun) {
    return undefined;
  }

  mockMountEffectHasRun = true;
  return callback();
});

function flattenText(children: React.ReactNode): string {
  if (Array.isArray(children)) {
    return children.map((child) => flattenText(child)).join('');
  }

  if (
    typeof children === 'string' ||
    typeof children === 'number' ||
    typeof children === 'boolean'
  ) {
    return String(children);
  }

  if (React.isValidElement(children)) {
    return flattenText(children.props.children);
  }

  return '';
}

function createEventRecord(overrides: Partial<any> = {}) {
  return {
    id: 'event-1',
    status: 'published',
    createdAt: '2026-03-10T12:00:00.000Z',
    updatedAt: '2026-03-10T12:00:00.000Z',
    publishedAt: '2026-03-10T12:00:00.000Z',
    title: 'Hope Worship',
    eventType: 'Worship Night',
    category: 'WORSHIP NIGHT',
    photoUri: '',
    heroImageUri: '',
    organizerName: 'You',
    organizerRole: 'Event Organizer',
    startDate: '2026-04-01',
    endDate: '2026-04-01',
    startTime: '9:30 AM',
    endTime: '8:30 PM',
    isSingleDayEvent: true,
    isOnline: false,
    onlineEventUrl: '',
    externalEventUrl: '',
    locationQuery: '',
    venueName: 'Hope Worship Venue',
    address: '1435 Harbour Oaks Road, Tucker, Georgia 30084, United States',
    description: 'Test event',
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
    tags: ['Event', 'Live'],
    isGoing: false,
    ...overrides,
  };
}

async function renderScreen(recordOverrides: Partial<any> = {}) {
  mockGetConnectPortalEventById.mockResolvedValue(createEventRecord(recordOverrides));

  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };
  const route = {
    key: 'connect-go-event-view',
    name: 'ConnectGoEventView',
    params: { eventId: 'event-1' },
  };

  let renderer!: TestRenderer.ReactTestRenderer;

  await act(async () => {
    renderer = TestRenderer.create(
      <EventViewScreen navigation={navigation as any} route={route as any} />
    );
    await Promise.resolve();
  });

  return { renderer, navigation };
}

describe('EventViewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMountEffectHasRun = false;
    mockSetConnectPortalEventGoing.mockResolvedValue({
      event: null,
      isGoing: true,
      registrationCount: 5,
      changed: true,
    });
  });

  it('uses photoUri for the hero image, renders Go!, and shows a chevron back button', async () => {
    const { renderer } = await renderScreen({
      photoUri: 'https://example.com/event-photo.jpg',
      heroImageUri: '',
      externalEventUrl: 'https://example.com/register',
      ticketType: 'external',
    });

    expect(
      renderer.root.findByProps({ testID: 'connect-event-hero-image' }).props.source
    ).toMatchObject({
      uri: 'https://example.com/event-photo.jpg',
    });

    expect(renderer.root.findByType('Ionicons').props.name).toBe('chevron-back');

    const heroStyle = StyleSheet.flatten(
      renderer.root.findByProps({ testID: 'connect-event-hero-image' }).props.style
    );
    const headerRowStyle = StyleSheet.flatten(
      renderer.root.findByProps({ testID: 'connect-event-header-row' }).props.style
    );
    const bottomBarStyle = StyleSheet.flatten(
      renderer.root.findByProps({ testID: 'connect-event-bottom-bar' }).props.style
    );

    expect(heroStyle.height).toBe(348);
    expect(headerRowStyle.paddingTop).toBe(44);
    expect(bottomBarStyle.paddingBottom).toBe(38);

    const textValues = renderer.root
      .findAllByType(Text)
      .map((node) => flattenText(node.props.children))
      .filter(Boolean);

    expect(textValues).toContain('Go!');
    expect(textValues).toContain('0 going');
    expect(textValues).not.toContain('Back');
    expect(textValues).not.toContain('Open Event Link');
    expect(textValues).not.toContain('Register Now');
  });

  it('toggles the Go button into a Going state and updates the count', async () => {
    const { renderer } = await renderScreen({
      registrationCount: 4,
      isGoing: false,
    });

    const action = renderer.root.findByProps({ testID: 'connect-event-primary-action' });

    await act(async () => {
      await action.props.onPress();
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSetConnectPortalEventGoing).toHaveBeenCalledWith('event-1', true);

    const textValues = renderer.root
      .findAllByType(Text)
      .map((node) => flattenText(node.props.children))
      .filter(Boolean);

    expect(textValues).toContain('Going');
    expect(textValues).toContain('5 going');
  });

  it('keeps the draft resume action for draft records', async () => {
    const { renderer } = await renderScreen({
      status: 'draft',
      ticketType: 'free',
    });

    const textValues = renderer.root
      .findAllByType(Text)
      .map((node) => flattenText(node.props.children))
      .filter(Boolean);

    expect(textValues).toContain('Resume Draft');
    expect(textValues).not.toContain('Go!');
  });

  it('renders multi-day schedule copy and online location details from the event record', async () => {
    const { renderer } = await renderScreen({
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      endTime: '4:00 PM',
      isSingleDayEvent: false,
      isOnline: true,
      onlineEventUrl: 'https://example.com/join',
      venueName: '',
      address: '',
      locationQuery: 'Streaming on OneBody Live',
    });

    const textValues = renderer.root
      .findAllByType(Text)
      .map((node) => flattenText(node.props.children))
      .filter(Boolean);

    expect(textValues).toContain('Apr 1, 2026 • 9:30 AM');
    expect(textValues).toContain('Apr 2, 2026 • 4:00 PM');
    expect(textValues).toContain('Online Event');
    expect(textValues).toContain('https://example.com/join');
  });
});
