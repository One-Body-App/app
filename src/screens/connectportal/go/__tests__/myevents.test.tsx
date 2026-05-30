import React from 'react';
import { Alert, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import MyEventsScreen from '../myevents';

const mockRefresh = jest.fn();
const mockDeleteConnectPortalDraft = jest.fn(async () => undefined);
const mockGetConnectPortalDraftByPublishedEventId = jest.fn(async () => null);
const mockGetDraftResumeRouteName = jest.fn(() => 'ConnectGoCreateStep4');

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('../../shared', () => ({
  useConnectPalette: jest.fn(() => ({
    isDark: true,
    screenBackground: '#0D0D0D',
    inputBg: '#10151d',
    border: '#25303c',
    textPrimary: '#e6eaec',
    textSecondary: '#9aacb1',
    inputPlaceholder: '#9aacb1',
  })),
}));

jest.mock('@/src/services/connectPortal', () => ({
  createConnectPortalDraft: jest.fn(),
  deleteConnectPortalDraft: (...args: unknown[]) => mockDeleteConnectPortalDraft(...args),
  formatConnectPortalDateTime: jest.fn((item: { startDate?: string }) =>
    item.startDate ? 'Apr 1, 2026 • 10:30 AM' : 'Date TBD'
  ),
  getConnectPortalDraftByPublishedEventId: (...args: unknown[]) =>
    mockGetConnectPortalDraftByPublishedEventId(...args),
  getDraftResumeRouteName: (...args: unknown[]) => mockGetDraftResumeRouteName(...args),
  getEventLifecycleState: jest.fn((item: { lifecycle?: string; status?: string }) => {
    if (item.status === 'draft') {
      return 'Draft';
    }
    return item.lifecycle || 'Past';
  }),
}));

jest.mock('@/src/services/connectPortal/provider', () => ({
  useConnectPortalData: jest.fn(() => ({
    snapshot: {
      organizerPublished: [
        {
          id: 'published-1',
          status: 'published',
          lifecycle: 'Past',
          title: "Hope Men's Retreat",
          startDate: '2026-04-01',
          venueName: 'Hope Retreat',
          address: '123 Main St',
          updatedAt: '2026-04-01T12:00:00.000Z',
        },
      ],
      drafts: [
        {
          id: 'draft-1',
          status: 'draft',
          title: 'Untitled Event',
          startDate: '',
          venueName: '',
          address: '',
          updatedAt: '2026-04-02T12:00:00.000Z',
          lastCompletedStep: 3,
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

describe('MyEventsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps Resume Draft routed through the saved draft step', () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MyEventsScreen
          navigation={navigation as any}
          route={{ key: 'myevents', name: 'ConnectGoMyEvents' } as any}
        />
      );
    });

    act(() => {
      renderer.root.findByProps({ testID: 'connect-my-events-resume-draft-1' }).props.onPress();
    });

    expect(mockGetDraftResumeRouteName).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'draft-1' })
    );
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectGoCreateStep4', {
      draftId: 'draft-1',
    });
  });

  it('sends Manage to the edit flow for published events', async () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MyEventsScreen
          navigation={navigation as any}
          route={{ key: 'myevents', name: 'ConnectGoMyEvents' } as any}
        />
      );
    });

    await act(async () => {
      await renderer.root
        .findByProps({ testID: 'connect-my-events-manage-published-1' })
        .props.onPress();
    });

    expect(mockGetConnectPortalDraftByPublishedEventId).toHaveBeenCalledWith('published-1');
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectGoCreateStep1', {
      eventId: 'published-1',
    });
  });

  it('reopens an existing published-event edit draft from Manage', async () => {
    mockGetConnectPortalDraftByPublishedEventId.mockResolvedValueOnce({
      id: 'draft-edit-1',
      status: 'draft',
      lastCompletedStep: 4,
      publishedEventId: 'published-1',
    });

    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MyEventsScreen
          navigation={navigation as any}
          route={{ key: 'myevents', name: 'ConnectGoMyEvents' } as any}
        />
      );
    });

    await act(async () => {
      await renderer.root
        .findByProps({ testID: 'connect-my-events-manage-published-1' })
        .props.onPress();
    });

    expect(mockGetDraftResumeRouteName).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'draft-edit-1' })
    );
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectGoCreateStep4', {
      draftId: 'draft-edit-1',
    });
  });

  it('asks for confirmation before deleting a draft and only deletes on confirm', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MyEventsScreen
          navigation={navigation as any}
          route={{ key: 'myevents', name: 'ConnectGoMyEvents' } as any}
        />
      );
    });

    act(() => {
      renderer.root.findByProps({ testID: 'connect-my-events-delete-draft-1' }).props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Are you sure?',
      'This draft will be permanently deleted.',
      expect.any(Array)
    );
    expect(mockDeleteConnectPortalDraft).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0]?.[2] as Array<{
      text?: string;
      onPress?: () => Promise<void> | void;
    }>;
    const deleteButton = buttons.find((button) => button.text === 'Delete');
    if (!deleteButton?.onPress) {
      throw new Error('Expected delete confirmation button');
    }

    await act(async () => {
      await deleteButton.onPress?.();
    });

    expect(mockDeleteConnectPortalDraft).toHaveBeenCalledWith('draft-1');
    expect(mockRefresh).toHaveBeenCalledWith(true);

    alertSpy.mockRestore();
  });

  it('renders the requested draft and published event actions', () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <MyEventsScreen
          navigation={navigation as any}
          route={{ key: 'myevents', name: 'ConnectGoMyEvents' } as any}
        />
      );
    });

    const textValues = renderer.root
      .findAllByType(Text)
      .map((node) => flattenText(node.props.children))
      .filter(Boolean);

    expect(textValues).toContain('Resume Draft');
    expect(textValues).toContain('Delete');
    expect(textValues).toContain('Manage');
    expect(textValues).toContain('Analytics');
  });
});
