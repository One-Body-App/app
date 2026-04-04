describe('muxDirectUploadBridge', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('reports native direct upload as unavailable when listener hooks are missing', async () => {
    jest.doMock('react-native', () => ({
      NativeModules: {
        MuxDirectUpload: {
          startUpload: jest.fn(),
          resumeCachedUploads: jest.fn(),
          getCachedUploads: jest.fn(),
        },
      },
      NativeEventEmitter: jest.fn(),
      Platform: { OS: 'ios' },
    }));

    let bridge: typeof import('../muxDirectUploadBridge');
    jest.isolateModules(() => {
      bridge = jest.requireActual('../muxDirectUploadBridge');
    });

    expect(bridge.isNativeMuxDirectUploadAvailable()).toBe(false);
  });

  it('throws a structured error when the native event bridge cannot be created', async () => {
    const startUpload = jest.fn(async () => undefined);

    jest.doMock('react-native', () => ({
      NativeModules: {
        MuxDirectUpload: {
          startUpload,
          resumeCachedUploads: jest.fn(async () => []),
          getCachedUploads: jest.fn(async () => []),
          addListener: jest.fn(),
          removeListeners: jest.fn(),
        },
      },
      NativeEventEmitter: jest.fn(() => {
        throw new Error('Emitter init failed');
      }),
      Platform: { OS: 'ios' },
    }));

    let bridge: typeof import('../muxDirectUploadBridge');
    jest.isolateModules(() => {
      bridge = jest.requireActual('../muxDirectUploadBridge');
    });

    await expect(
      bridge.startNativeMuxDirectUpload({
        uploadId: 'upload-1',
        uploadUrl: 'https://mux.example/upload',
        fileUri: 'file:///tmp/video.mp4',
      })
    ).rejects.toMatchObject({
      name: 'NativeMuxDirectUploadError',
      message: 'Emitter init failed',
    });
    expect(startUpload).not.toHaveBeenCalled();
  });
});
