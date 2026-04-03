/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Linking, Share, TextInput } from 'react-native';
import RNFS from 'react-native-fs';
import ServeApplicationsScreen from '../srvapplications';

const mockUseConnectPortalData = jest.fn();
const mockListApplications = jest.fn();
const mockFormatConnectPortalDate = jest.fn((value: string) => `formatted-${value}`);

jest.mock('@react-native-vector-icons/material-icons', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return ({ name, testID }: { name?: string; testID?: string }) =>
    ReactLocal.createElement(View, {
      accessibilityLabel: name,
      testID,
    });
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (effect: () => void | (() => void)) => {
    effect();
  },
}));

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    TemporaryDirectoryPath: '/mock-temp',
    CachesDirectoryPath: '/mock-cache',
    DocumentDirectoryPath: '/mock-documents',
    writeFile: jest.fn(),
  },
}));

jest.mock('@/src/services/connectPortal', () => ({
  listConnectServeJobApplications: (...args: any[]) => mockListApplications(...args),
  formatConnectPortalDate: (...args: any[]) => mockFormatConnectPortalDate(...args),
}));

jest.mock('@/src/services/connectPortal/provider', () => ({
  useConnectPortalData: () => mockUseConnectPortalData(),
}));

jest.mock('../../shared', () => ({
  BRAND_COLORS: {
    primaryDark: '#126b87',
    primaryBase: '#41899f',
    infoDark: '#12d2d9',
    white: '#ffffff',
    black: '#032f3c',
    successBg: '#EDFFF9',
    successText: '#12AC7B',
    grays: {
      100: '#e6eaec',
      200: '#cdd5d8',
      400: '#9aacb1',
      500: '#81979e',
      600: '#68828a',
      700: '#4f6d77',
    },
  },
  ServeHeader: () => {
    const ReactLocal = require('react');
    const { View } = require('react-native');
    return ReactLocal.createElement(View);
  },
  useServePalette: () => ({
    isDark: false,
    background: '#ffffff',
    text: '#032f3c',
    subText: '#4f6d77',
    inputBg: '#e6eaec',
    inputBorder: '#cdd5d8',
    borderColor: '#cdd5d8',
    cardBg: '#ffffff',
    accent: '#126b87',
  }),
}));

const jobRecord = {
  id: 'job-1',
  title: 'Accountant',
  organizationName: 'Lakewood Church',
  address: 'Toronto',
  opportunityType: 'Job Opportunity',
  description: 'Help oversee the accounting and reporting workflow for the finance team.',
  hiringStatus: 'open' as const,
  applicantCount: 7,
  publishedAt: '2026-03-30T09:00:00.000Z',
  updatedAt: '2026-03-31T12:00:00.000Z',
  createdAt: '2026-03-29T12:00:00.000Z',
};

const primaryApplicant = {
  id: 'application-1',
  jobId: 'job-1',
  ownerUserId: 'owner-1',
  applicantUserId: 'user-1',
  createdAt: '2026-03-31T12:00:00.000Z',
  updatedAt: '2026-03-31T12:00:00.000Z',
  name: 'Nick Building',
  email: 'nick@example.com',
  phone: '+1 404 555 0101',
  location: 'Clarkston, Georgia, United States',
  profilePhotoUri: '',
  testimony: 'Ready to serve.',
  consentAccepted: true,
  resumeFileName: 'resume.pdf',
  resumeFileUrl: 'https://cdn.example.com/resume.pdf',
  resumeMimeType: 'application/pdf',
};

const secondaryApplicant = {
  ...primaryApplicant,
  id: 'application-2',
  applicantUserId: 'user-2',
  name: 'Maria Stone',
  email: 'maria@example.com',
  phone: '+1 416 555 0102',
  location: 'Toronto, Ontario, Canada',
  resumeFileName: '',
  resumeFileUrl: '',
  testimony: '',
};

const flattenTextChildren = (children: React.ReactNode): string => {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => flattenTextChildren(child)).join('');
  }

  return '';
};

const hasText = (root: TestRenderer.ReactTestRenderer['root'], text: string) =>
  root.findAll(
    (node) => node.type === 'Text' && flattenTextChildren(node.props.children).includes(text)
  ).length > 0;

jest.setTimeout(40000);

describe('ServeApplicationsScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-01T12:00:00.000Z'));
    mockUseConnectPortalData.mockReturnValue({
      serve: {
        organizerRecords: [jobRecord],
      },
    });
    mockListApplications.mockReset();
    mockFormatConnectPortalDate.mockClear();
    (RNFS.writeFile as jest.Mock).mockReset().mockResolvedValue(undefined);
    jest.spyOn(Linking, 'openURL').mockResolvedValueOnce();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders the rich opportunity header details', async () => {
    mockListApplications.mockResolvedValue([primaryApplicant]);

    let root: TestRenderer.ReactTestRenderer;
    await act(async () => {
      root = TestRenderer.create(
        <ServeApplicationsScreen
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'applications',
              name: 'ConnectServeApplications',
              params: { jobId: 'job-1' },
            } as any
          }
        />
      );
    });

    expect(hasText(root!.root, 'Accountant')).toBe(true);
    expect(hasText(root!.root, 'Lakewood Church • Toronto')).toBe(true);
    expect(hasText(root!.root, 'Job Opportunity')).toBe(true);
    expect(hasText(root!.root, 'Active')).toBe(true);
    expect(hasText(root!.root, 'formatted-2026-03-30')).toBe(true);
  });

  it('filters applicants from the search input', async () => {
    mockListApplications.mockResolvedValue([primaryApplicant, secondaryApplicant]);

    let root: TestRenderer.ReactTestRenderer;
    await act(async () => {
      root = TestRenderer.create(
        <ServeApplicationsScreen
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'applications',
              name: 'ConnectServeApplications',
              params: { jobId: 'job-1' },
            } as any
          }
        />
      );
    });

    const searchInput = root!.root.findByType(TextInput);

    await act(async () => {
      searchInput.props.onChangeText('maria');
    });

    expect(hasText(root!.root, 'Maria Stone')).toBe(true);
    expect(hasText(root!.root, 'Nick Building')).toBe(false);
  });

  it('shows the enhanced empty state when there are no applicants', async () => {
    mockListApplications.mockResolvedValue([]);

    let root: TestRenderer.ReactTestRenderer;
    await act(async () => {
      root = TestRenderer.create(
        <ServeApplicationsScreen
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'applications',
              name: 'ConnectServeApplications',
              params: { jobId: 'job-1' },
            } as any
          }
        />
      );
    });

    expect(root!.root.findByProps({ testID: 'applications-empty-icon' })).toBeTruthy();
    expect(hasText(root!.root, 'No applicants yet')).toBe(true);
    expect(hasText(root!.root, 'New applications for this opportunity will appear here.')).toBe(
      true
    );
  });

  it('shows the no-match state when search returns nothing', async () => {
    mockListApplications.mockResolvedValue([primaryApplicant]);

    let root: TestRenderer.ReactTestRenderer;
    await act(async () => {
      root = TestRenderer.create(
        <ServeApplicationsScreen
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'applications',
              name: 'ConnectServeApplications',
              params: { jobId: 'job-1' },
            } as any
          }
        />
      );
    });

    const searchInput = root!.root.findByType(TextInput);

    await act(async () => {
      searchInput.props.onChangeText('unmatched');
    });

    expect(hasText(root!.root, 'No matches found')).toBe(true);
    expect(hasText(root!.root, 'Try a different applicant name or contact detail.')).toBe(true);
  });

  it('renders a resume action when an applicant has an uploaded resume', async () => {
    mockListApplications.mockResolvedValue([primaryApplicant]);

    let root: TestRenderer.ReactTestRenderer;
    await act(async () => {
      root = TestRenderer.create(
        <ServeApplicationsScreen
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'applications',
              name: 'ConnectServeApplications',
              params: { jobId: 'job-1' },
            } as any
          }
        />
      );
    });

    const resumeButton = root!.root.findByProps({
      testID: 'resume-link-application-1',
    });

    await act(async () => {
      await resumeButton.props.onPress();
    });

    expect(Linking.openURL).toHaveBeenCalledWith('https://cdn.example.com/resume.pdf');
  });

  it('exports applicants as a CSV and opens the native share sheet', async () => {
    mockListApplications.mockResolvedValue([primaryApplicant]);

    let root: TestRenderer.ReactTestRenderer;
    await act(async () => {
      root = TestRenderer.create(
        <ServeApplicationsScreen
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'applications',
              name: 'ConnectServeApplications',
              params: { jobId: 'job-1' },
            } as any
          }
        />
      );
    });

    const exportButton = root!.root.findByProps({ testID: 'export-csv-button' });

    await act(async () => {
      await exportButton.props.onPress();
    });

    expect(RNFS.writeFile).toHaveBeenCalledWith(
      '/mock-temp/applications-accountant-2026-04-01.csv',
      expect.stringContaining('"Name","Email","Phone","Location","Submitted At"'),
      'utf8'
    );
    expect(RNFS.writeFile).toHaveBeenCalledWith(
      '/mock-temp/applications-accountant-2026-04-01.csv',
      expect.stringContaining('"Nick Building","nick@example.com"'),
      'utf8'
    );
    expect(Share.share).toHaveBeenCalledWith({
      title: 'Applications for Accountant',
      url: 'file:///mock-temp/applications-accountant-2026-04-01.csv',
      message: undefined,
    });
  });

  it('disables export when there are no applicants', async () => {
    mockListApplications.mockResolvedValue([]);

    let root: TestRenderer.ReactTestRenderer;
    await act(async () => {
      root = TestRenderer.create(
        <ServeApplicationsScreen
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'applications',
              name: 'ConnectServeApplications',
              params: { jobId: 'job-1' },
            } as any
          }
        />
      );
    });

    const exportButton = root!.root.findByProps({ testID: 'export-csv-button' });
    expect(exportButton.props.disabled).toBe(true);
  });

  it('renders the error state when application loading fails', async () => {
    mockListApplications.mockRejectedValue(new Error('Unable to load applications.'));

    let root: TestRenderer.ReactTestRenderer;
    await act(async () => {
      root = TestRenderer.create(
        <ServeApplicationsScreen
          navigation={{ navigate: jest.fn() } as any}
          route={
            {
              key: 'applications',
              name: 'ConnectServeApplications',
              params: { jobId: 'job-1' },
            } as any
          }
        />
      );
    });

    expect(hasText(root!.root, 'Unable to load applicants')).toBe(true);
    expect(hasText(root!.root, 'Unable to load applications.')).toBe(true);
  });
});
