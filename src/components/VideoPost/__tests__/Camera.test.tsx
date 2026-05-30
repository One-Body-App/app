/* eslint-disable global-require, import/first, react/jsx-props-no-spreading */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { View } from 'react-native';

let mockLatestCameraProps: any;
let mockCurrentFrontDevice: any;

const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn();
const mockCancelRecording = jest.fn();
const mockFocus = jest.fn();

const mockBackWideDevice = {
  id: 'back-wide',
  position: 'back',
  physicalDevices: ['wide-angle-camera'],
  hasTorch: true,
  supportsFocus: true,
  minZoom: 1,
  maxZoom: 10,
  neutralZoom: 1,
  minExposure: -2,
  maxExposure: 2,
};

const mockBackFallbackDevice = {
  ...mockBackWideDevice,
  id: 'back-fallback',
  physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera'],
};

const mockFrontFacingDevice = {
  id: 'front-camera',
  position: 'front',
  physicalDevices: ['wide-angle-camera'],
  hasTorch: false,
  supportsFocus: true,
  minZoom: 1,
  maxZoom: 4,
  neutralZoom: 1,
  minExposure: -2,
  maxExposure: 2,
};

jest.mock('react-native-vision-camera', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');

  const MockCamera = ReactModule.forwardRef((props: any, ref: any) => {
    mockLatestCameraProps = props;
    ReactModule.useImperativeHandle(ref, () => ({
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      cancelRecording: mockCancelRecording,
      focus: mockFocus,
    }));

    return <NativeView testID="mock-vision-camera" />;
  });

  return {
    Camera: Object.assign(MockCamera, {
      getCameraPermissionStatus: jest.fn(() => 'granted'),
      requestCameraPermission: jest.fn(async () => 'granted'),
      getMicrophonePermissionStatus: jest.fn(() => 'granted'),
      requestMicrophonePermission: jest.fn(async () => 'granted'),
    }),
    useCameraDevice: jest.fn((position: string, filter?: { physicalDevices?: string[] }) => {
      if (position === 'front') {
        return mockCurrentFrontDevice;
      }

      if (filter?.physicalDevices?.includes('wide-angle-camera')) {
        return mockBackWideDevice;
      }

      return mockBackFallbackDevice;
    }),
    useCameraFormat: jest.fn(() => ({
      maxFps: 60,
      minFps: 24,
      supportsVideoHdr: true,
      videoStabilizationModes: ['auto', 'off'],
    })),
  };
});

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    getPhotos: jest.fn(async () => ({
      edges: [{ node: { image: { uri: 'file://gallery-preview.jpg' } } }],
    })),
  },
}));
jest.mock('@/components/primitives/FastImage', () => {
  const { View: NativeView } = require('react-native');

  function MockFastImage(props: any) {
    return <NativeView {...props} />;
  }

  MockFastImage.resizeMode = {
    contain: 'contain',
  };

  return MockFastImage;
});
jest.mock('@react-native-vector-icons/material-icons', () => {
  const { View: NativeView } = require('react-native');

  return function MockMaterialIcons(props: any) {
    return <NativeView {...props} />;
  };
});
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
  useNavigation: jest.fn(() => ({
    canGoBack: jest.fn(() => false),
    goBack: jest.fn(),
  })),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));
jest.mock('../../styled/Text', () => {
  const { Text: NativeText } = require('react-native');

  return function MockStyledText({ children, ...rest }: { children: React.ReactNode }) {
    return <NativeText {...rest}>{children}</NativeText>;
  };
});

import CameraComponent from '../Camera';
import {
  getDefaultRecorderCaptureSettings,
  isNoRecordingInProgressError,
  shouldAllowCameraFlip,
} from '../Camera.utils';

describe('CameraComponent', () => {
  beforeEach(() => {
    mockLatestCameraProps = undefined;
    mockCurrentFrontDevice = mockFrontFacingDevice;
    mockStartRecording.mockReset();
    mockStopRecording.mockReset();
    mockCancelRecording.mockReset();
    mockFocus.mockReset();
  });

  const renderCamera = async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(
        <CameraComponent setVideoPath={jest.fn()} onClose={jest.fn()}>
          <View />
        </CameraComponent>
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    return tree!;
  };

  it('uses the back wide-angle device by default and only switches front after explicit flip', async () => {
    const tree = await renderCamera();

    expect(mockLatestCameraProps.device.id).toBe('back-wide');
    expect(mockLatestCameraProps.isMirrored).toBe(false);

    await act(async () => {
      tree.root.findByProps({ testID: 'video-recorder-flip-camera-button' }).props.onPress();
    });

    expect(mockLatestCameraProps.device.id).toBe('front-camera');
    expect(mockLatestCameraProps.isMirrored).toBe(true);
  });

  it('does not flip while recording or when the target device is unavailable', async () => {
    expect(
      shouldAllowCameraFlip({
        isRecording: true,
        isTearingDown: false,
        hasTargetDevice: true,
      })
    ).toBe(false);
    mockCurrentFrontDevice = undefined;
    const unavailableTree = await renderCamera();

    await act(async () => {
      unavailableTree.root
        .findByProps({ testID: 'video-recorder-flip-camera-button' })
        .props.onPress();
    });

    expect(mockLatestCameraProps.device.id).toBe('back-wide');
  });

  it('starts with safer iOS video defaults and resets torch off on front camera', async () => {
    const tree = await renderCamera();
    const iosDefaults = getDefaultRecorderCaptureSettings('ios');

    expect(mockLatestCameraProps.video).toBe(true);
    expect(mockLatestCameraProps.photo).toBeUndefined();
    expect(mockLatestCameraProps.videoBitRate).toBe(iosDefaults.videoBitRate);
    expect(iosDefaults.videoCodec).toBe('h264');

    await act(async () => {
      mockLatestCameraProps.onInitialized();
      await Promise.resolve();
    });

    await act(async () => {
      tree.root.findByProps({ testID: 'video-recorder-flash-button' }).props.onPress();
    });

    expect(mockLatestCameraProps.torch).toBe('on');

    await act(async () => {
      tree.root.findByProps({ testID: 'video-recorder-flip-camera-button' }).props.onPress();
    });

    expect(mockLatestCameraProps.device.id).toBe('front-camera');
    expect(mockLatestCameraProps.torch).toBe('off');
  });

  it('treats no-recording-in-progress errors as non-fatal stop errors', () => {
    expect(
      isNoRecordingInProgressError({
        code: 'capture/no-recording-in-progress',
      })
    ).toBe(true);
    expect(
      isNoRecordingInProgressError(
        new Error(
          'There was no active video recording in progress! Did you call stopRecording() twice?'
        )
      )
    ).toBe(true);
    expect(
      isNoRecordingInProgressError({
        cause: {
          code: 'capture/no-recording-in-progress',
        },
      })
    ).toBe(true);
    expect(
      isNoRecordingInProgressError({
        code: 'capture/recording-canceled',
      })
    ).toBe(false);
    expect(isNoRecordingInProgressError(new Error('different error'))).toBe(false);
  });
});
