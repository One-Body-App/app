import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import ServeCreateJobStep2 from '../srvstep2';

const mockCreateFlowLayout = jest.fn();
const mockGetConnectServeJobDraftById = jest.fn();
const mockSaveConnectServeJobDraft = jest.fn();
const mockPublishConnectServeJobDraft = jest.fn();
const mockUseConnectPortalData = jest.fn(() => ({}));

jest.mock('@/src/services/connectPortal', () => ({
  getConnectServeJobDraftById: (...args: any[]) => mockGetConnectServeJobDraftById(...args),
  saveConnectServeJobDraft: (...args: any[]) => mockSaveConnectServeJobDraft(...args),
  publishConnectServeJobDraft: (...args: any[]) => mockPublishConnectServeJobDraft(...args),
}));

jest.mock('@/src/services/connectPortal/provider', () => ({
  useConnectPortalData: () => mockUseConnectPortalData(),
}));

jest.mock('@/src/hooks/useMountEffect', () => (callback: () => void) => {
  const ReactLocal = jest.requireActual('react');
  ReactLocal.useEffect(callback, []);
});

jest.mock('../../../go/createflow/shared', () => ({
  CreateFlowLayout: (props: any) => {
    const ReactLocal = jest.requireActual('react');
    const { View: MockView } = jest.requireActual('react-native');
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

const createDraft = (overrides: Record<string, unknown> = {}) => ({
  id: 'draft-1',
  status: 'draft',
  createdAt: '2026-03-31T00:00:00.000Z',
  updatedAt: '2026-03-31T00:00:00.000Z',
  visibility: 'public',
  hiringStatus: 'open',
  lastCompletedStep: 1,
  sector: 'Ministry',
  title: 'Youth Pastor',
  description: 'Description',
  requirements: ['Leadership'],
  address: 'Atlanta',
  locationQuery: 'Atlanta',
  opportunityType: 'Contract',
  compensationAmount: '200',
  compensationFrequency: 'per_week',
  applicationMethods: [],
  applicationUrl: '',
  organizationName: 'OneBody Church',
  denomination: 'Non-Denominational',
  applicantCount: 0,
  ...overrides,
});

describe('ServeCreateJobStep2', () => {
  beforeEach(() => {
    mockCreateFlowLayout.mockClear();
    mockGetConnectServeJobDraftById.mockReset();
    mockSaveConnectServeJobDraft.mockReset();
    mockPublishConnectServeJobDraft.mockReset();
    mockUseConnectPortalData.mockReturnValue({
      serve: {
        refresh: jest.fn(() => Promise.resolve()),
      },
    });
    mockSaveConnectServeJobDraft.mockResolvedValue(createDraft());
    mockPublishConnectServeJobDraft.mockResolvedValue({
      ...createDraft({ status: 'published', applicationMethods: ['in_app'] }),
      status: 'published',
    });
  });

  const renderScreen = async (draftOverrides: Record<string, unknown> = {}) => {
    mockGetConnectServeJobDraftById.mockResolvedValue(createDraft(draftOverrides));
    let testRenderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      testRenderer = TestRenderer.create(
        <ServeCreateJobStep2
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'serve-step-2',
              name: 'ConnectServeCreateJobStep2',
              params: { draftId: 'draft-1' },
            } as any
          }
        />
      );
    });

    return testRenderer!;
  };

  it('allows publish when Apply in One Body is selected without an external URL', async () => {
    const testRenderer = await renderScreen();

    await act(async () => {
      testRenderer.root.findByProps({ testID: 'application-method-in_app' }).props.onPress();
    });

    const layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;
    expect(layoutProps.nextDisabled).toBe(false);

    await act(async () => {
      await layoutProps.onSave();
    });

    expect(mockSaveConnectServeJobDraft).toHaveBeenCalledWith(
      'draft-1',
      expect.objectContaining({
        applicationMethods: ['in_app'],
        applicationUrl: '',
      })
    );
  });

  it('requires a valid URL when only External link is selected', async () => {
    const testRenderer = await renderScreen();

    await act(async () => {
      testRenderer.root.findByProps({ testID: 'application-method-external_link' }).props.onPress();
    });

    let layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;
    expect(layoutProps.nextDisabled).toBe(true);

    const urlInput = testRenderer.root.findByProps({ testID: 'application-url-input' });
    await act(async () => {
      urlInput.props.onChangeText('https://example.com/apply');
    });

    layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;
    expect(layoutProps.nextDisabled).toBe(false);
  });

  it('supports selecting both application methods and keeps the URL field visible', async () => {
    const testRenderer = await renderScreen();

    await act(async () => {
      testRenderer.root.findByProps({ testID: 'application-method-in_app' }).props.onPress();
      testRenderer.root.findByProps({ testID: 'application-method-external_link' }).props.onPress();
    });

    const urlInput = testRenderer.root.findByProps({ testID: 'application-url-input' });
    expect(urlInput).toBeDefined();

    await act(async () => {
      urlInput.props.onChangeText('https://example.com/apply');
    });

    const layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;
    expect(layoutProps.nextDisabled).toBe(false);
  });

  it('hydrates application methods from the draft and shows the URL field for external links', async () => {
    const testRenderer = await renderScreen({
      applicationMethods: ['in_app', 'external_link'],
      applicationUrl: 'https://example.com/apply',
    });

    const urlInput = testRenderer.root.findByProps({ testID: 'application-url-input' });
    expect(urlInput.props.value).toBe('https://example.com/apply');

    const buttons = testRenderer.root.findAllByType(TouchableOpacity);
    expect(buttons.some((button) => button.props.testID === 'application-method-in_app')).toBe(
      true
    );
    expect(
      buttons.some((button) => button.props.testID === 'application-method-external_link')
    ).toBe(true);
  });

  it('clears the application URL when External link is deselected', async () => {
    const testRenderer = await renderScreen({
      applicationMethods: ['external_link'],
      applicationUrl: 'https://example.com/apply',
    });

    await act(async () => {
      testRenderer.root.findByProps({ testID: 'application-method-external_link' }).props.onPress();
    });

    const layoutProps = mockCreateFlowLayout.mock.calls.at(-1)?.[0] as any;

    await act(async () => {
      await layoutProps.onSave();
    });

    expect(mockSaveConnectServeJobDraft).toHaveBeenCalledWith(
      'draft-1',
      expect.objectContaining({
        applicationMethods: [],
        applicationUrl: '',
      })
    );
  });
});
