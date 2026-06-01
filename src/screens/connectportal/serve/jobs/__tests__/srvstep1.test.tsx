/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import ServeCreateJobStep1 from '../srvstep1';

const mockCreateFlowLayout = jest.fn();
const mockCreateConnectServeJobDraft = jest.fn();
const mockSaveConnectServeJobDraft = jest.fn();
const mockGetConnectServeJobDraftById = jest.fn();
const mockSubmitConnectServeRoleSuggestion = jest.fn();
const mockUseConnectPortalData = jest.fn(() => ({}));

jest.mock('@/components/MapBox', () => {
  function MockView() {
    return null;
  }

  return {
    __esModule: true,
    default: MockView,
    MapBoxTypes: {
      address: 'address',
      place: 'place',
      locality: 'locality',
    },
  };
});

jest.mock('@/src/services/connectPortal', () => ({
  createConnectServeJobDraft: (...args: any[]) => mockCreateConnectServeJobDraft(...args),
  saveConnectServeJobDraft: (...args: any[]) => mockSaveConnectServeJobDraft(...args),
  getConnectServeJobDraftById: (...args: any[]) => mockGetConnectServeJobDraftById(...args),
  submitConnectServeRoleSuggestion: (...args: any[]) =>
    mockSubmitConnectServeRoleSuggestion(...args),
  formatConnectServeRequirementsText: jest.fn(() => ''),
  parseConnectServeRequirements: jest.fn((value: string) =>
    value
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
  ),
}));

jest.mock('@/src/services/connectPortal/provider', () => ({
  useConnectPortalData: () => mockUseConnectPortalData(),
}));

jest.mock('@/src/components/CustomModal', () => {
  const ReactLocal = require('react');
  const { View: MockView } = require('react-native');

  return function MockCustomModal(props: any) {
    if (!props.modalVisible) {
      return null;
    }

    return ReactLocal.createElement(MockView, { testID: 'mock-custom-modal' }, props.children);
  };
});

jest.mock('@/src/hooks/useMountEffect', () => {
  const ReactLocal = require('react');
  return (callback: () => void | (() => void)) => {
    ReactLocal.useEffect(() => callback(), []);
  };
});

jest.mock('../../../go/createflow/shared', () => ({
  CreateFlowLayout: (props: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    mockCreateFlowLayout(props);
    return ReactLocal.createElement(MockView, null, props.children);
  },
  useCreateFlowPalette: () => ({
    textPrimary: '#032f3c',
    textSecondary: '#4f6d77',
    inputBg: '#ffffff',
    inputBorder: '#cdd5d8',
    inputText: '#032f3c',
    inputPlaceholder: '#9aacb1',
  }),
}));

describe('ServeCreateJobStep1', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockCreateFlowLayout.mockClear();
    mockCreateConnectServeJobDraft.mockReset();
    mockSaveConnectServeJobDraft.mockReset();
    mockGetConnectServeJobDraftById.mockReset();
    mockSubmitConnectServeRoleSuggestion.mockReset();
    mockUseConnectPortalData.mockReturnValue({
      serve: {
        refresh: jest.fn(),
        roleTypeOptions: [],
      },
    });
  });

  it('shows church role options and excludes opportunity types from the role picker', () => {
    let testRenderer: TestRenderer.ReactTestRenderer;

    act(() => {
      testRenderer = TestRenderer.create(
        <ServeCreateJobStep1
          navigation={{ navigate: jest.fn() } as any}
          route={
            { key: 'serve-step-1', name: 'ConnectServeCreateJobStep1', params: undefined } as any
          }
        />
      );
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-picker-trigger' }).props.onPress();
    });

    const texts = testRenderer!.root
      .findAllByType(Text)
      .map((node) => node.props.children)
      .filter((value): value is string => typeof value === 'string');

    expect(texts).toContain('Interim Pastor');
    expect(texts).toContain('Drummer');
    expect(texts).toContain('Church Administrator');
    expect(texts).not.toContain('Full time');
    expect(texts).not.toContain('Part time');
    expect(texts).not.toContain('Contract');
    expect(texts).not.toContain('Volunteer');
  });

  it('filters role options case-insensitively from the search input', () => {
    let testRenderer: TestRenderer.ReactTestRenderer;

    act(() => {
      testRenderer = TestRenderer.create(
        <ServeCreateJobStep1
          navigation={{ navigate: jest.fn() } as any}
          route={
            { key: 'serve-step-1', name: 'ConnectServeCreateJobStep1', params: undefined } as any
          }
        />
      );
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-picker-trigger' }).props.onPress();
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-search-input' }).props.onChangeText('drUM');
    });

    const texts = testRenderer!.root
      .findAllByType(Text)
      .map((node) => node.props.children)
      .filter((value): value is string => typeof value === 'string');

    expect(texts).toContain('Drummer');
    expect(texts).not.toContain('Interim Pastor');
  });

  it('adds a custom role from the search empty state and submits a suggestion', async () => {
    mockCreateConnectServeJobDraft.mockResolvedValue({ id: 'serve-draft-custom-add' });
    mockSaveConnectServeJobDraft.mockResolvedValue({ id: 'serve-draft-custom-add' });
    const navigation = { navigate: jest.fn() };

    let testRenderer: TestRenderer.ReactTestRenderer;
    act(() => {
      testRenderer = TestRenderer.create(
        <ServeCreateJobStep1
          navigation={navigation as any}
          route={
            { key: 'serve-step-1', name: 'ConnectServeCreateJobStep1', params: undefined } as any
          }
        />
      );
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-picker-trigger' }).props.onPress();
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-search-input' }).props.onChangeText('janitor');
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-add-custom' }).props.onPress();
    });

    expect(mockSubmitConnectServeRoleSuggestion).toHaveBeenCalledWith('janitor');

    const layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;
    await act(async () => {
      await layoutProps.onSave();
    });

    expect(mockCreateConnectServeJobDraft).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'janitor' })
    );
  });

  it('does not create a draft on mount when opening a new opportunity', () => {
    act(() => {
      TestRenderer.create(
        <ServeCreateJobStep1
          navigation={{ navigate: jest.fn() } as any}
          route={
            { key: 'serve-step-1', name: 'ConnectServeCreateJobStep1', params: undefined } as any
          }
        />
      );
    });

    expect(mockCreateConnectServeJobDraft).not.toHaveBeenCalled();
    const layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;
    expect(layoutProps?.loading).toBe(false);
  });

  it('creates and saves a draft when saving without an existing draft id', async () => {
    const refresh = jest.fn(() => Promise.resolve());
    const navigation = { navigate: jest.fn() };
    mockUseConnectPortalData.mockReturnValue({
      serve: {
        refresh,
        roleTypeOptions: [],
      },
    });
    mockCreateConnectServeJobDraft.mockResolvedValue({ id: 'serve-draft-1' });
    mockSaveConnectServeJobDraft.mockResolvedValue({ id: 'serve-draft-1' });

    act(() => {
      TestRenderer.create(
        <ServeCreateJobStep1
          navigation={navigation as any}
          route={
            { key: 'serve-step-1', name: 'ConnectServeCreateJobStep1', params: undefined } as any
          }
        />
      );
    });

    const layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;

    await act(async () => {
      await layoutProps.onSave();
    });

    expect(mockCreateConnectServeJobDraft).toHaveBeenCalledTimes(1);
    expect(mockSaveConnectServeJobDraft).toHaveBeenCalledWith(
      'serve-draft-1',
      expect.objectContaining({
        visibility: 'public',
        lastCompletedStep: 0,
      })
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).toHaveBeenCalledWith('ConnectServeHome');
  });

  it('stores the selected predefined role in the draft title', async () => {
    const refresh = jest.fn(() => Promise.resolve());
    mockUseConnectPortalData.mockReturnValue({
      serve: {
        refresh,
        roleTypeOptions: [],
      },
    });
    mockCreateConnectServeJobDraft.mockResolvedValue({ id: 'serve-draft-2' });
    mockSaveConnectServeJobDraft.mockResolvedValue({ id: 'serve-draft-2' });

    let testRenderer: TestRenderer.ReactTestRenderer;
    act(() => {
      testRenderer = TestRenderer.create(
        <ServeCreateJobStep1
          navigation={{ navigate: jest.fn() } as any}
          route={
            { key: 'serve-step-1', name: 'ConnectServeCreateJobStep1', params: undefined } as any
          }
        />
      );
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-picker-trigger' }).props.onPress();
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-option-Interim Pastor' }).props.onPress();
    });

    const layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;
    await act(async () => {
      await layoutProps.onSave();
    });

    expect(mockCreateConnectServeJobDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Interim Pastor',
      })
    );
  });

  it('shows custom draft titles as a selectable option in the picker', async () => {
    mockGetConnectServeJobDraftById.mockResolvedValue({
      id: 'serve-draft-custom',
      visibility: 'public',
      title: 'Liturgical Arts Coordinator',
      description: '',
      requirements: [],
      address: '',
      coordinate: undefined,
    });

    let testRenderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      testRenderer = TestRenderer.create(
        <ServeCreateJobStep1
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'serve-step-1',
              name: 'ConnectServeCreateJobStep1',
              params: { draftId: 'serve-draft-custom' },
            } as any
          }
        />
      );
    });

    const triggerText = testRenderer!.root
      .findByProps({ testID: 'role-picker-trigger' })
      .findAllByType(Text)[0];
    expect(triggerText.props.children).toBe('Liturgical Arts Coordinator');

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-picker-trigger' }).props.onPress();
    });

    expect(
      testRenderer!.root
        .findAllByType(Text)
        .some((node) => node.props.children === 'Liturgical Arts Coordinator')
    ).toBe(true);
  });

  it('keeps the next step disabled until the location includes a coordinate', async () => {
    mockGetConnectServeJobDraftById.mockResolvedValue({
      id: 'serve-draft-no-coordinate',
      visibility: 'public',
      title: 'Interim Pastor',
      description: 'Lead weekend services',
      requirements: ['Preach'],
      address: '123 Main St',
      coordinate: undefined,
    });

    await act(async () => {
      TestRenderer.create(
        <ServeCreateJobStep1
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'serve-step-1',
              name: 'ConnectServeCreateJobStep1',
              params: { draftId: 'serve-draft-no-coordinate' },
            } as any
          }
        />
      );
    });

    const layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;
    expect(layoutProps.nextDisabled).toBe(true);
  });

  it('resets the role search when the sheet closes', () => {
    let testRenderer: TestRenderer.ReactTestRenderer;

    act(() => {
      testRenderer = TestRenderer.create(
        <ServeCreateJobStep1
          navigation={{ navigate: jest.fn() } as any}
          route={
            { key: 'serve-step-1', name: 'ConnectServeCreateJobStep1', params: undefined } as any
          }
        />
      );
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-picker-trigger' }).props.onPress();
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-search-input' }).props.onChangeText('music');
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-sheet-close' }).props.onPress();
    });

    act(() => {
      testRenderer!.root.findByProps({ testID: 'role-picker-trigger' }).props.onPress();
    });

    const reopenedSearchInput = testRenderer!.root.findByProps({ testID: 'role-search-input' });
    expect(reopenedSearchInput.props.value).toBe('');
    expect(
      testRenderer!.root
        .findAllByType(Text)
        .some((node) => node.props.children === 'Music Director')
    ).toBe(true);
    expect(
      testRenderer!.root
        .findAllByType(Text)
        .some((node) => node.props.children === 'Interim Pastor')
    ).toBe(true);
  });
});
