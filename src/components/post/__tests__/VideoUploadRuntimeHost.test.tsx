import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import VideoUploadRuntimeHost from '../VideoUploadRuntimeHost';

const mockVideoProcessingRuntime = jest.fn(() => null);

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

jest.mock('@/src/services/notification/pushNotificationService', () => ({
  displayVideoUploadLocalNotification: jest.fn(() => Promise.resolve()),
}));

describe('VideoUploadRuntimeHost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts the upload runtime host without a moderation bridge', () => {
    act(() => {
      TestRenderer.create(<VideoUploadRuntimeHost />);
    });

    expect(mockVideoProcessingRuntime).toHaveBeenCalledTimes(1);
  });
});
