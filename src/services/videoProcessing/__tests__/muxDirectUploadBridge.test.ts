describe('muxDirectUploadBridge', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('times out when native upload startup never emits a callback', async () => {
    let eventHandler: ((event: Record<string, unknown>) => void) | undefined;
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
      NativeEventEmitter: jest.fn(() => ({
        addListener: jest.fn(
          (_eventName: string, handler: (event: Record<string, unknown>) => void) => {
            eventHandler = handler;
            return { remove: jest.fn() };
          }
        ),
      })),
      Platform: { OS: 'ios' },
    }));

    let bridge: typeof import('../muxDirectUploadBridge');
    jest.isolateModules(() => {
      bridge = jest.requireActual('../muxDirectUploadBridge');
    });

    const uploadPromise = bridge.startNativeMuxDirectUpload({
      uploadId: 'upload-timeout-1',
      uploadUrl: 'https://mux.example/upload',
      fileUri: 'file:///tmp/video.mp4',
    });

    expect(eventHandler).toBeDefined();

    await Promise.resolve();
    jest.advanceTimersByTime(bridge.NATIVE_UPLOAD_STARTUP_TIMEOUT_MS);

    await expect(uploadPromise).rejects.toMatchObject({
      name: 'NativeMuxDirectUploadError',
      code: 'startup_timeout',
      startedBytes: false,
    });
    expect(startUpload).toHaveBeenCalledTimes(1);
  });

  it('resolves successfully when native upload emits terminal events', async () => {
    let eventHandler: ((event: Record<string, unknown>) => void) | undefined;

    jest.doMock('react-native', () => ({
      NativeModules: {
        MuxDirectUpload: {
          startUpload: jest.fn(async () => undefined),
          resumeCachedUploads: jest.fn(async () => []),
          getCachedUploads: jest.fn(async () => []),
          addListener: jest.fn(),
          removeListeners: jest.fn(),
        },
      },
      NativeEventEmitter: jest.fn(() => ({
        addListener: jest.fn(
          (_eventName: string, handler: (event: Record<string, unknown>) => void) => {
            eventHandler = handler;
            return { remove: jest.fn() };
          }
        ),
      })),
      Platform: { OS: 'ios' },
    }));

    let bridge: typeof import('../muxDirectUploadBridge');
    jest.isolateModules(() => {
      bridge = jest.requireActual('../muxDirectUploadBridge');
    });

    const uploadPromise = bridge.startNativeMuxDirectUpload({
      uploadId: 'upload-success-1',
      uploadUrl: 'https://mux.example/upload',
      fileUri: 'file:///tmp/video.mp4',
    });

    eventHandler?.({
      uploadId: 'upload-success-1',
      state: 'progress',
      bytesUploaded: 10,
      bytesTotal: 100,
    });
    eventHandler?.({
      uploadId: 'upload-success-1',
      state: 'success',
      bytesUploaded: 100,
      bytesTotal: 100,
    });

    await expect(uploadPromise).resolves.toBeUndefined();
  });

  it('returns cached startup diagnostics for stalled native uploads', async () => {
    jest.doMock('react-native', () => ({
      NativeModules: {
        MuxDirectUpload: {
          startUpload: jest.fn(async () => undefined),
          resumeCachedUploads: jest.fn(async () => []),
          getCachedUploads: jest.fn(async () => [
            {
              uploadId: 'upload-stalled-1',
              fileUri: 'file:///tmp/video.mp4',
              state: 'uploading',
              startupState: 'starting',
              startupStep: 'start_called',
              startupUpdatedAt: '2026-04-07T10:00:00.000Z',
            },
          ]),
          addListener: jest.fn(),
          removeListeners: jest.fn(),
        },
      },
      NativeEventEmitter: jest.fn(() => ({
        addListener: jest.fn(() => ({ remove: jest.fn() })),
      })),
      Platform: { OS: 'ios' },
    }));

    let bridge: typeof import('../muxDirectUploadBridge');
    jest.isolateModules(() => {
      bridge = jest.requireActual('../muxDirectUploadBridge');
    });

    const [record] = await bridge.getNativeMuxDirectUploads();

    expect(record).toEqual(
      expect.objectContaining({
        uploadId: 'upload-stalled-1',
        startupState: 'starting',
        startupStep: 'start_called',
        startupUpdatedAt: '2026-04-07T10:00:00.000Z',
      })
    );
    expect(bridge.hasTimedOutNativeMuxStartup(record, Date.parse('2026-04-07T10:00:16.000Z'))).toBe(
      true
    );
  });
});
