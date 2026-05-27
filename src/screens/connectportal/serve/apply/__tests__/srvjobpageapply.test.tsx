/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import ServeJobPageApply from '../srvjobpageapply';
import { MAX_RESUME_BYTES, normalizeResumeSelection } from '../srvjobpageapply.utils';

const mockUseSelector = jest.fn();
const mockUseConnectPortalData = jest.fn();
const mockSubmitApplication = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
}));

jest.mock('react-native-toast-notifications', () => ({
  useToast: () => ({
    show: jest.fn(),
  }),
}));

jest.mock('@/src/services/connectPortal', () => ({
  submitConnectServeJobApplication: (...args: any[]) => mockSubmitApplication(...args),
}));

jest.mock('@/src/services/connectPortal/provider', () => ({
  useConnectPortalData: () => mockUseConnectPortalData(),
}));

jest.mock('../../shared', () => ({
  BRAND_COLORS: {
    white: '#ffffff',
    black: '#032f3c',
    grays: {
      100: '#e6eaec',
      200: '#cdd5d8',
      300: '#b3c1c5',
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
}));

jest.mock('../srvjobpageapplysuccess', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return function MockSuccessModal() {
    return ReactLocal.createElement(View);
  };
});

describe('ServeJobPageApply', () => {
  beforeEach(() => {
    mockSubmitApplication.mockReset();
    mockUseSelector.mockImplementation((selector: any) =>
      selector({
        auth: {
          getProfileData: {
            name: 'Nick Building',
            email: 'nick@example.com',
            profileImage: '',
            profile: {
              contactPhoneNumber: '+1 404 555 0101',
              location: {
                address: 'Clarkston, Georgia, United States',
              },
            },
          },
        },
      })
    );
    mockUseConnectPortalData.mockReturnValue({
      serve: {
        publicRecords: [
          {
            id: 'job-1',
            title: 'Worship Leader',
          },
        ],
        organizerRecords: [],
        refresh: jest.fn(),
      },
    });
  });

  it('renders the mission-aligned hero copy and upload section', () => {
    let root: TestRenderer.ReactTestRenderer;

    act(() => {
      root = TestRenderer.create(
        <ServeJobPageApply
          navigation={{ goBack: jest.fn(), navigate: jest.fn() } as any}
          route={{ key: 'apply', name: 'ConnectServeJobApply', params: { jobId: 'job-1' } } as any}
        />
      );
    });

    expect(root!.root.findByProps({ children: 'Step into your calling.' })).toBeTruthy();
    expect(
      root!.root.findByProps({ children: 'Upload Resume or Ministry Portfolio' })
    ).toBeTruthy();
    expect(root!.root.findByProps({ children: 'Tap to upload' })).toBeTruthy();
  });

  it('rejects oversized file selections before upload', () => {
    expect(
      normalizeResumeSelection({
        name: 'resume.pdf',
        uri: 'file:///resume.pdf',
        size: MAX_RESUME_BYTES + 1,
        type: 'application/pdf',
      })
    ).toEqual({
      error: 'Please choose a resume or portfolio smaller than 5MB.',
    });
  });

  it('rejects unsupported file selections before upload', () => {
    expect(
      normalizeResumeSelection({
        name: 'resume.exe',
        uri: 'file:///resume.exe',
        size: 1024,
        type: 'application/octet-stream',
      })
    ).toEqual({
      error: 'Please upload a PDF, DOC, or DOCX file.',
    });
  });
});
