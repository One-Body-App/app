import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import EventDashboardScreen from '../eventdash';

const mockRefresh = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useNavigation: jest.fn(() => ({
    canGoBack: jest.fn(() => true),
    goBack: jest.fn(),
  })),
}));

jest.mock('@react-native-vector-icons/ionicons', () => {
  return function MockIonicons() {
    return null;
  };
});

jest.mock('../../shared', () => ({
  useConnectPalette: jest.fn(() => ({
    isDark: true,
    screenBackground: '#0D0D0D',
    inputBg: 'rgba(14,19,26,0.72)',
    border: 'rgba(255,255,255,0.1)',
    borderStrong: 'rgba(230,234,236,0.14)',
    textPrimary: '#e6eaec',
    textSecondary: '#9aacb1',
    inputPlaceholder: '#9aacb1',
    activeText: '#126b87',
  })),
}));

jest.mock('@/src/services/connectPortal', () => ({
  createConnectPortalDraft: jest.fn(),
  formatConnectPortalNumber: jest.fn((value: number) => String(value)),
  formatConnectPortalDateTime: jest.fn(() => 'May 1 at 7:00 PM'),
  getEventCapacityLabel: jest.fn(() => '12 of 100 registered'),
  getEventLifecycleState: jest.fn((item: { lifecycle?: string }) => item.lifecycle ?? 'Active'),
  getEventProgressRatio: jest.fn(() => 0.42),
}));

jest.mock('@/src/services/connectPortal/provider', () => ({
  useConnectPortalData: jest.fn(() => ({
    snapshot: {
      organizerPublished: [
        {
          id: 'event-1',
          title: 'Spring Revival Night',
          category: 'Community',
          venueName: 'Main Hall',
          address: '123 Main St',
          registrationCount: 12,
          viewCount: 45,
          openCount: 18,
          lifecycle: 'Active',
        },
      ],
      drafts: [
        {
          id: 'draft-1',
        },
      ],
    },
    refresh: mockRefresh,
  })),
}));

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

describe('EventDashboardScreen', () => {
  it('renders the event management dashboard copy and actions', () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<EventDashboardScreen navigation={navigation as any} />);
    });

    const textValues = renderer.root
      .findAllByType(Text)
      .map((node) => flattenText(node.props.children))
      .filter(Boolean);

    expect(textValues).toContain('New Event');
    expect(textValues).toContain('Start the seven-step event flow.');
    expect(textValues).toContain('My Events');
    expect(textValues).toContain('Open active events, past events, and drafts.');
    expect(textValues).toContain('Active Events');
    expect(textValues).toContain('View all');
    expect(textValues).toContain('Manage Event');
    expect(textValues.filter((value) => value === 'Analytics')).toHaveLength(2);
  });
});
