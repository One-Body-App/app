/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ActionSheetIOS, TextInput, TouchableOpacity } from 'react-native';
import ServeCreateJobStep1 from '../srvstep1';

const mockCreateFlowLayout = jest.fn();
const mockCreateConnectServeJobDraft = jest.fn();
const mockSaveConnectServeJobDraft = jest.fn();
const mockGetConnectServeJobDraftById = jest.fn();
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

jest.mock('@/src/hooks/useMountEffect', () => (callback: () => void) => {
  const ReactLocal = require('react');
  ReactLocal.useEffect(callback, []);
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
    mockUseConnectPortalData.mockReturnValue({
      serve: {
        refresh: jest.fn(),
        roleTypeOptions: [],
      },
    });
  });

  it('shows church role options and excludes opportunity types from the role picker', () => {
    const actionSheetSpy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(jest.fn());
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

    const buttons = testRenderer!.root.findAllByType(TouchableOpacity);
    act(() => {
      buttons[1].props.onPress();
    });

    const options = actionSheetSpy.mock.calls.at(-1)?.[0]?.options as string[];
    expect(options).toContain('Interim Pastor');
    expect(options).toContain('Drummer');
    expect(options).toContain('Church Administrator');
    expect(options).toContain('Other');
    expect(options).not.toContain('Full time');
    expect(options).not.toContain('Part time');
    expect(options).not.toContain('Contract');
    expect(options).not.toContain('Volunteer');
  });

  it('shows a custom role input when Other is selected', () => {
    const actionSheetSpy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(jest.fn());
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

    const buttons = testRenderer!.root.findAllByType(TouchableOpacity);
    act(() => {
      buttons[1].props.onPress();
    });

    const selectRole = actionSheetSpy.mock.calls.at(-1)?.[1] as (index: number) => void;
    const options = actionSheetSpy.mock.calls.at(-1)?.[0]?.options as string[];
    act(() => {
      selectRole(options.indexOf('Other'));
    });

    const customRoleInput = testRenderer!.root
      .findAllByType(TextInput)
      .find((input) => input.props.placeholder === 'Enter the role');
    expect(customRoleInput).toBeDefined();
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
    const actionSheetSpy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(jest.fn());
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

    const buttons = testRenderer!.root.findAllByType(TouchableOpacity);
    act(() => {
      buttons[1].props.onPress();
    });

    const selectRole = actionSheetSpy.mock.calls.at(-1)?.[1] as (index: number) => void;
    const options = actionSheetSpy.mock.calls.at(-1)?.[0]?.options as string[];
    act(() => {
      selectRole(options.indexOf('Interim Pastor'));
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

  it('maps custom draft titles back to Other', async () => {
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

    const customRoleInput = testRenderer!.root
      .findAllByType(TextInput)
      .find((input) => input.props.placeholder === 'Enter the role');
    expect(customRoleInput?.props.value).toBe('Liturgical Arts Coordinator');
  });
});
