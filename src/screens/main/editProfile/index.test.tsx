import React from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { useSelector } from 'react-redux';
import EditProfile from './index';

const mockDispatch = jest.fn();
const mockUseSelector = useSelector as jest.Mock;
const mockLaunchImageLibrary = jest.fn();
const mockLaunchCamera = jest.fn();
const mockOpenCropper = jest.fn();
const mockRequestExternalWritePermission = jest.fn();
const mockApiCall = jest.fn();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => mockDispatch),
  useSelector: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  const actual = jest.requireActual('@react-navigation/native');

  return {
    ...actual,
    useTheme: jest.fn(() => ({
      colors: {
        background: '#FFFFFF',
        card: '#F8F8F8',
        text: '#111111',
      },
      dark: false,
    })),
    useFocusEffect: jest.fn((callback) => {
      React.useEffect(() => callback(), [callback]);
    }),
  };
});

jest.mock('react-native-image-picker', () => ({
  launchCamera: (...args: unknown[]) => mockLaunchCamera(...args),
  launchImageLibrary: (...args: unknown[]) => mockLaunchImageLibrary(...args),
}));

jest.mock('react-native-image-crop-picker', () => ({
  openCropper: (...args: unknown[]) => mockOpenCropper(...args),
}));

jest.mock('@/utils/ImageAndCamera', () => ({
  requestExternalWritePermission: (...args: unknown[]) =>
    mockRequestExternalWritePermission(...args),
}));

jest.mock('@/src/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));

jest.mock('react-native-fast-image', () => {
  // eslint-disable-next-line global-require
  const React = require('react');
  const component = ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement('FastImage', props, children);
  (component as any).resizeMode = { cover: 'cover', contain: 'contain' };
  return component;
});

jest.mock('react-native-date-picker', () => () => null);
jest.mock('iconsax-react-native', () => ({
  ArrowDown2: () => null,
  Calendar: () => null,
  GalleryEdit: () => null,
}));
jest.mock('@/components/Button', () => () => null);
jest.mock('@/components/MapBox', () => () => null);
jest.mock('../myProfile/SettingsSheet', () => () => null);
jest.mock('@/components/styled/Select', () => () => null);
jest.mock('@/assets/icons/search.svg', () => 'SearchIcon');
jest.mock('@/components/styled/Text', () => {
  /* eslint-disable global-require, react/function-component-definition */
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement(Text, props, children);
  /* eslint-enable global-require, react/function-component-definition */
});
jest.mock('@/components/styled/TextInput', () => {
  /* eslint-disable global-require, react/function-component-definition */
  const React = require('react');
  return ({ label, ...props }: { label?: string; [key: string]: unknown }) =>
    React.createElement('StyledTextInput', { ...props, accessibilityLabel: label });
  /* eslint-enable global-require, react/function-component-definition */
});

const mockUser = {
  _id: 'user-1',
  accountType: 'individual',
  name: 'Nick Building',
  username: 'iosind3.22connect2',
  website: '',
  bio: '',
  gender: '',
  interests: [],
  profileHeader: '',
  profileImage: 'https://cdn.onebodyapp.com/user/no-image.png',
  profile: {
    companyName: '',
    whatIDo: null,
    organizationCategory: '',
    typeOfOrganization: null,
    contactName: '',
    contactEmail: '',
    contactPhoneNumber: '',
    organizationSize: '',
    dateOfBirth: '',
    oftenChurch: '',
    churchSubType: '',
    churchType: '',
    isLocationPublic: false,
    isChurchTypePublic: false,
    location: null,
  },
};

const buildProps = (openMediaPicker?: 'photo' | 'header') => ({
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
    setParams: jest.fn(),
  },
  route: {
    key: 'EditProfile',
    name: 'EditProfile',
    params: openMediaPicker ? { openMediaPicker } : {},
  },
});

describe('EditProfile native media chooser', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseSelector.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          getProfileData: mockUser,
          userToken: 'token',
        },
      })
    );
    mockApiCall.mockResolvedValue({ status: 200, response: [] });
    mockLaunchImageLibrary.mockResolvedValue({
      assets: [{ uri: '/tmp/gallery.jpg' }],
    });
    mockLaunchCamera.mockResolvedValue({
      assets: [{ uri: '/tmp/camera.jpg', type: 'image/jpeg', fileName: 'camera.jpg' }],
    });
    mockOpenCropper.mockResolvedValue({
      mime: 'image/jpeg',
      path: '/tmp/cropped.jpg',
    });
    mockRequestExternalWritePermission.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('opens the iOS action sheet for a photo intent and routes gallery selection through the photo crop flow', async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const actionSheetSpy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(() => undefined);
    const props = buildProps('photo');

    await act(async () => {
      TestRenderer.create(<EditProfile {...(props as any)} />);
    });

    expect(props.navigation.setParams).toHaveBeenCalledWith({ openMediaPicker: undefined });
    expect(actionSheetSpy).toHaveBeenCalledTimes(1);
    expect(actionSheetSpy.mock.calls[0]?.[0]).toMatchObject({
      options: ['Cancel', 'Choose From Gallery', 'Open Camera'],
      cancelButtonIndex: 0,
    });

    await act(async () => {
      actionSheetSpy.mock.calls[0]?.[1](1);
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockLaunchImageLibrary).toHaveBeenCalledWith(
      expect.objectContaining({ mediaType: 'photo' })
    );
    expect(mockOpenCropper).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/tmp/gallery.jpg',
        cropperCircleOverlay: true,
      })
    );

    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('opens the Android alert for a header intent and routes camera selection through the header crop flow', async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const props = buildProps('header');

    await act(async () => {
      TestRenderer.create(<EditProfile {...(props as any)} />);
    });

    expect(props.navigation.setParams).toHaveBeenCalledWith({ openMediaPicker: undefined });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]?.[0]).toBe('Select image source');
    const alertButtons = alertSpy.mock.calls[0]?.[2] ?? [];
    expect(alertButtons.map((button: { text: string }) => button.text)).toEqual([
      'Cancel',
      'Choose From Gallery',
      'Open Camera',
    ]);

    await act(async () => {
      alertButtons[2].onPress();
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockRequestExternalWritePermission).toHaveBeenCalled();
    expect(mockLaunchCamera).toHaveBeenCalledWith(
      expect.objectContaining({ mediaType: 'photo', quality: 0.8 })
    );
    expect(mockOpenCropper).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/tmp/camera.jpg',
        cropperCircleOverlay: false,
        width: expect.any(Number),
        height: expect.any(Number),
      })
    );

    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('opens the native chooser from both edit buttons', async () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const props = buildProps();
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<EditProfile {...(props as any)} />);
    });

    const avatarButton = renderer!.root.findByProps({ testID: 'edit-profile-avatar-image-button' });
    const headerButton = renderer!.root.findByProps({ testID: 'edit-profile-header-image-button' });

    act(() => {
      avatarButton.props.onPress();
      headerButton.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledTimes(2);

    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });
});
