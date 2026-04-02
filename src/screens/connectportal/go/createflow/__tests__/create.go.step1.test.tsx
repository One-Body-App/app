import React from 'react';
import { Text, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import BasicInfoScreen from '../create.go.step1';

const mockEnsureStepOneDraftRecord = jest.fn();
const mockGetConnectEventTypeOptions = jest.fn();
const mockGetConnectPortalEventById = jest.fn();
const mockCreateConnectPortalEditDraftFromPublishedEvent = jest.fn();
const mockSaveConnectPortalDraft = jest.fn();

let mockLatestLayoutProps: any;
const mockReact = React;
const MockView = View;
const MockText = Text;

jest.mock('../shared', () => ({
  CreateFlowLayout: (props: any) => {
    mockLatestLayoutProps = props;
    return mockReact.createElement(MockView, null, props.children);
  },
  ensureStepOneDraftRecord: (...args: unknown[]) => mockEnsureStepOneDraftRecord(...args),
  useCreateFlowPalette: jest.fn(() => ({
    textPrimary: '#032f3c',
    textSecondary: '#4F6D77',
    inputBg: '#FFFFFF',
    inputBorder: '#D7E1E5',
    inputText: '#032f3c',
    inputPlaceholder: '#8AA0A8',
    accent: '#126b87',
  })),
}));

jest.mock('../EventTypeDropdown', () => {
  return function MockEventTypeDropdown(props: any) {
    return mockReact.createElement(
      MockText,
      { testID: 'mock-event-type-dropdown' },
      props.selectedValue || props.customValue || 'none'
    );
  };
});

jest.mock('@/src/hooks/useMountEffect', () => (callback: () => void) => callback());
jest.mock('react-native-image-crop-picker', () => ({
  openCropper: jest.fn(),
  openPicker: jest.fn(),
  openCamera: jest.fn(),
}));
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));
jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');

jest.mock('@/src/services/connectPortal', () => ({
  createConnectPortalEditDraftFromPublishedEvent: (...args: unknown[]) =>
    mockCreateConnectPortalEditDraftFromPublishedEvent(...args),
  getConnectEventTypeOptions: (...args: unknown[]) => mockGetConnectEventTypeOptions(...args),
  getConnectPortalEventById: (...args: unknown[]) => mockGetConnectPortalEventById(...args),
  saveConnectPortalDraft: (...args: unknown[]) => mockSaveConnectPortalDraft(...args),
  submitConnectEventTypeSuggestion: jest.fn(),
}));

describe('BasicInfoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLatestLayoutProps = null;
    mockGetConnectEventTypeOptions.mockResolvedValue([
      { label: 'Retreat', value: 'Retreat' },
      { label: 'Bible Study', value: 'Bible Study' },
    ]);
    mockSaveConnectPortalDraft.mockImplementation(async (draftId: string, updates: any) => ({
      id: draftId,
      ...updates,
    }));
  });

  it('resumes an existing draft with prefilled values', async () => {
    mockEnsureStepOneDraftRecord.mockResolvedValue({
      id: 'draft-1',
      status: 'draft',
      title: 'Saved Draft Title',
      eventType: 'Retreat',
      heroImageUri: 'file:///hero.jpg',
      publishedEventId: undefined,
    });

    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BasicInfoScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-1',
              name: 'ConnectGoCreateStep1',
              params: { draftId: 'draft-1' },
            } as any
          }
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      renderer.root.findByProps({
        placeholder: 'e.g., Young Adult Worship Night, Fall Retreat',
      }).props.value
    ).toBe('Saved Draft Title');
    expect(renderer.root.findByProps({ testID: 'mock-event-type-dropdown' }).props.children).toBe(
      'Retreat'
    );
    expect(mockEnsureStepOneDraftRecord).toHaveBeenCalledWith('draft-1');
  });

  it('loads a published event into local state without creating a draft immediately', async () => {
    mockGetConnectPortalEventById.mockResolvedValue({
      id: 'published-1',
      status: 'published',
      title: "Hope Men's Retreat",
      eventType: 'Retreat',
      heroImageUri: 'https://example.com/hero.jpg',
    });

    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BasicInfoScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-1',
              name: 'ConnectGoCreateStep1',
              params: { eventId: 'published-1' },
            } as any
          }
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      renderer.root.findByProps({
        placeholder: 'e.g., Young Adult Worship Night, Fall Retreat',
      }).props.value
    ).toBe("Hope Men's Retreat");
    expect(renderer.root.findByProps({ testID: 'mock-event-type-dropdown' }).props.children).toBe(
      'Retreat'
    );
    expect(mockCreateConnectPortalEditDraftFromPublishedEvent).not.toHaveBeenCalled();
    expect(mockSaveConnectPortalDraft).not.toHaveBeenCalled();
  });

  it('blocks Next when title is blank', async () => {
    mockEnsureStepOneDraftRecord.mockResolvedValue({
      id: 'draft-blank',
      status: 'draft',
      title: '',
      eventType: 'Retreat',
      heroImageUri: undefined,
      publishedEventId: undefined,
    });

    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <BasicInfoScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-1',
              name: 'ConnectGoCreateStep1',
              params: { draftId: 'draft-blank' },
            } as any
          }
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockLatestLayoutProps.nextDisabled).toBe(true);
    expect(
      renderer.root
        .findAllByType(Text)
        .some((node) => node.props.children === 'Add an event title to continue.')
    ).toBe(true);

    await act(async () => {
      await mockLatestLayoutProps.onNext();
    });

    expect(mockSaveConnectPortalDraft).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalledWith('ConnectGoCreateStep2', expect.anything());
  });

  it('creates a seeded draft on Next when editing a published event', async () => {
    mockGetConnectPortalEventById.mockResolvedValue({
      id: 'published-1',
      status: 'published',
      title: "Hope Men's Retreat",
      eventType: 'Retreat',
      heroImageUri: 'https://example.com/hero.jpg',
    });
    mockCreateConnectPortalEditDraftFromPublishedEvent.mockResolvedValue({
      id: 'draft-edit-1',
      publishedEventId: 'published-1',
    });

    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    await act(async () => {
      TestRenderer.create(
        <BasicInfoScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-1',
              name: 'ConnectGoCreateStep1',
              params: { eventId: 'published-1' },
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

    expect(mockLatestLayoutProps.nextDisabled).toBe(false);
    expect(mockCreateConnectPortalEditDraftFromPublishedEvent).toHaveBeenCalledWith('published-1');
    expect(mockSaveConnectPortalDraft).toHaveBeenCalledWith(
      'draft-edit-1',
      expect.objectContaining({
        title: "Hope Men's Retreat",
        eventType: 'Retreat',
      }),
      { completedStep: 1 }
    );
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectGoCreateStep2', {
      draftId: 'draft-edit-1',
    });
  });

  it('creates a seeded draft on Save Draft when editing a published event', async () => {
    mockGetConnectPortalEventById.mockResolvedValue({
      id: 'published-1',
      status: 'published',
      title: "Hope Men's Retreat",
      eventType: 'Retreat',
      heroImageUri: 'https://example.com/hero.jpg',
    });
    mockCreateConnectPortalEditDraftFromPublishedEvent.mockResolvedValue({
      id: 'draft-edit-1',
      publishedEventId: 'published-1',
    });

    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    await act(async () => {
      TestRenderer.create(
        <BasicInfoScreen
          navigation={navigation as any}
          route={
            {
              key: 'step-1',
              name: 'ConnectGoCreateStep1',
              params: { eventId: 'published-1' },
            } as any
          }
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await mockLatestLayoutProps.onSave();
    });

    expect(mockCreateConnectPortalEditDraftFromPublishedEvent).toHaveBeenCalledWith('published-1');
    expect(mockSaveConnectPortalDraft).toHaveBeenCalledWith(
      'draft-edit-1',
      expect.objectContaining({
        title: "Hope Men's Retreat",
        eventType: 'Retreat',
      }),
      { completedStep: 0 }
    );
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectGoMyEvents', {
      initialFilter: 'Draft',
    });
  });
});
