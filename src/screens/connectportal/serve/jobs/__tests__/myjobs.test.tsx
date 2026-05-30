/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import ServeMyJobsScreen from '../myjobs';

const mockServeHeader = jest.fn();
const mockUseConnectPortalData = jest.fn(() => ({}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => callback(),
}));

jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');
jest.mock(
  '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg',
  () => 'FilterSortIcon'
);
jest.mock('@/src/components/CustomModal', () => 'CustomModal');

jest.mock('@/src/services/connectPortal', () => ({
  formatConnectPortalDate: jest.fn((value: string) => value),
  getConnectServeResumeRouteName: jest.fn(() => 'ConnectServeCreateJobStep1'),
}));

jest.mock('@/src/services/connectPortal/provider', () => ({
  useConnectPortalData: () => mockUseConnectPortalData(),
}));

jest.mock('../../shared', () => ({
  BRAND_COLORS: {
    black: '#032f3c',
    white: '#ffffff',
  },
  ServeHeader: (props: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    mockServeHeader(props);
    return ReactLocal.createElement(MockView);
  },
  ServeHubTabs: () => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    return ReactLocal.createElement(MockView);
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
    tabInactive: '#68828a',
    accent: '#126b87',
  }),
}));

describe('ServeMyJobsScreen', () => {
  beforeEach(() => {
    mockServeHeader.mockClear();
    mockUseConnectPortalData.mockReturnValue({
      serve: {
        refresh: jest.fn(),
        draftRecords: [],
        organizerRecords: [],
      },
    });
  });

  it('renders a header create action wired to step 1 of the serve create flow', async () => {
    const navigation = {
      navigate: jest.fn(),
      canGoBack: jest.fn(() => false),
      goBack: jest.fn(),
    };

    act(() => {
      TestRenderer.create(
        <ServeMyJobsScreen navigation={navigation as any} route={undefined as any} />
      );
    });

    const serveHeaderProps = mockServeHeader.mock.calls.at(-1)?.[0] as any;
    expect(serveHeaderProps?.rightAccessory).toBeTruthy();

    const actionButton = serveHeaderProps.rightAccessory;

    await act(async () => {
      actionButton.props.onPress();
    });

    expect(navigation.navigate).toHaveBeenCalledWith('ConnectServeCreateJobStep1');
  });
});
