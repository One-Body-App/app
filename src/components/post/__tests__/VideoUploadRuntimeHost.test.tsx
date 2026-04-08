import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import VideoUploadRuntimeHost from '../VideoUploadRuntimeHost';

const mockVideoProcessingRuntime = jest.fn(() => null);
const mockVideoModerationBridge = jest.fn(() => null);

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector: (state: any) => unknown) =>
    selector({
      auth: {
        getProfileData: {
          _id: 'user-1',
        },
      },
    })
  ),
}));

jest.mock('react-native-toast-notifications', () => ({
  useToast: jest.fn(() => ({
    show: jest.fn(),
  })),
}));

jest.mock('../VideoProcessingRuntime', () => ({
  __esModule: true,
  default: (props: unknown) => mockVideoProcessingRuntime(props),
}));

jest.mock('../VideoModerationBridge', () => ({
  __esModule: true,
  default: () => mockVideoModerationBridge(),
}));

jest.mock('@/src/services/notification/pushNotificationService', () => ({
  displayVideoUploadLocalNotification: jest.fn(() => Promise.resolve()),
}));

describe('VideoUploadRuntimeHost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts both the upload runtime and the moderation bridge', () => {
    act(() => {
      TestRenderer.create(<VideoUploadRuntimeHost />);
    });

    expect(mockVideoModerationBridge).toHaveBeenCalledTimes(1);
    expect(mockVideoProcessingRuntime).toHaveBeenCalledTimes(1);
  });
});
