import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type NativeMuxDirectUploadState = 'uploading' | 'paused' | 'failed' | 'success';
export type NativeMuxDirectUploadStartupState = 'starting' | 'active' | 'terminal';

export type NativeMuxDirectUploadRecord = {
  uploadId: string;
  fileUri?: string;
  state: NativeMuxDirectUploadState;
  bytesUploaded?: number;
  bytesTotal?: number;
  errorCode?: string;
  errorMessage?: string;
  startupState?: NativeMuxDirectUploadStartupState;
  startupStep?: string;
  startupUpdatedAt?: string;
  firstCallbackAt?: string;
};

type NativeMuxDirectUploadStartParams = {
  uploadId: string;
  uploadUrl: string;
  fileUri: string;
};

type NativeMuxDirectUploadModule = {
  startUpload: (params: NativeMuxDirectUploadStartParams) => Promise<void>;
  resumeCachedUploads: () => Promise<NativeMuxDirectUploadRecord[]>;
  getCachedUploads: () => Promise<NativeMuxDirectUploadRecord[]>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

type NativeMuxDirectUploadEvent = Omit<NativeMuxDirectUploadRecord, 'state'> & {
  state: 'progress' | 'success' | 'failure';
};

type UploadWaiter = {
  resolve: () => void;
  reject: (error: NativeMuxDirectUploadError) => void;
};

export const NATIVE_UPLOAD_STARTUP_TIMEOUT_MS = 15_000;

const EVENT_NAME = 'muxDirectUploadEvent';

const nativeModule = NativeModules.MuxDirectUpload as
  | Partial<NativeMuxDirectUploadModule>
  | undefined;

const uploadStateById = new Map<string, NativeMuxDirectUploadRecord>();
const waitersById = new Map<string, UploadWaiter[]>();
const firstCallbackWaitersById = new Map<string, Array<() => void>>();
let emitterSubscription:
  | {
      remove: () => void;
    }
  | undefined;

const logBridge = (message: string, payload?: Record<string, unknown>) => {
  if (__DEV__) {
    console.log('[MuxDirectUploadBridge]', message, payload ?? {});
  }
};

export class NativeMuxDirectUploadError extends Error {
  public readonly code?: string;

  public readonly startedBytes: boolean;

  public constructor(
    message: string,
    options: {
      code?: string;
      startedBytes?: boolean;
    } = {}
  ) {
    super(message);
    this.name = 'NativeMuxDirectUploadError';
    this.code = options.code;
    this.startedBytes = options.startedBytes ?? false;
  }
}

const normalizeRecord = (
  value: Partial<NativeMuxDirectUploadRecord> | null | undefined
): NativeMuxDirectUploadRecord | null => {
  const uploadId = typeof value?.uploadId === 'string' ? value.uploadId.trim() : '';
  const state =
    value?.state === 'uploading' ||
    value?.state === 'paused' ||
    value?.state === 'failed' ||
    value?.state === 'success'
      ? value.state
      : null;

  if (!uploadId || !state) {
    return null;
  }

  const startupState =
    value?.startupState === 'starting' ||
    value?.startupState === 'active' ||
    value?.startupState === 'terminal'
      ? value.startupState
      : undefined;
  const startupStep =
    typeof value?.startupStep === 'string' && value.startupStep.trim() !== ''
      ? value.startupStep
      : undefined;
  const startupUpdatedAt =
    typeof value?.startupUpdatedAt === 'string' && value.startupUpdatedAt.trim() !== ''
      ? value.startupUpdatedAt
      : undefined;
  const firstCallbackAt =
    typeof value?.firstCallbackAt === 'string' && value.firstCallbackAt.trim() !== ''
      ? value.firstCallbackAt
      : undefined;

  return {
    uploadId,
    fileUri:
      typeof value?.fileUri === 'string' && value.fileUri.trim() !== '' ? value.fileUri : undefined,
    state,
    bytesUploaded: typeof value?.bytesUploaded === 'number' ? value.bytesUploaded : undefined,
    bytesTotal: typeof value?.bytesTotal === 'number' ? value.bytesTotal : undefined,
    errorCode: typeof value?.errorCode === 'string' ? value.errorCode : undefined,
    errorMessage: typeof value?.errorMessage === 'string' ? value.errorMessage : undefined,
    startupState,
    startupStep,
    startupUpdatedAt,
    firstCallbackAt,
  };
};

const normalizeEvent = (
  value: Partial<NativeMuxDirectUploadEvent> | null | undefined
): NativeMuxDirectUploadEvent | null => {
  const uploadId = typeof value?.uploadId === 'string' ? value.uploadId.trim() : '';
  const state =
    value?.state === 'progress' || value?.state === 'success' || value?.state === 'failure'
      ? value.state
      : null;

  if (!uploadId || !state) {
    return null;
  }

  const startupState =
    value?.startupState === 'starting' ||
    value?.startupState === 'active' ||
    value?.startupState === 'terminal'
      ? value.startupState
      : undefined;
  const startupStep =
    typeof value?.startupStep === 'string' && value.startupStep.trim() !== ''
      ? value.startupStep
      : undefined;
  const startupUpdatedAt =
    typeof value?.startupUpdatedAt === 'string' && value.startupUpdatedAt.trim() !== ''
      ? value.startupUpdatedAt
      : undefined;
  const firstCallbackAt =
    typeof value?.firstCallbackAt === 'string' && value.firstCallbackAt.trim() !== ''
      ? value.firstCallbackAt
      : undefined;

  return {
    uploadId,
    fileUri:
      typeof value?.fileUri === 'string' && value.fileUri.trim() !== '' ? value.fileUri : undefined,
    state,
    bytesUploaded: typeof value?.bytesUploaded === 'number' ? value.bytesUploaded : undefined,
    bytesTotal: typeof value?.bytesTotal === 'number' ? value.bytesTotal : undefined,
    errorCode: typeof value?.errorCode === 'string' ? value.errorCode : undefined,
    errorMessage: typeof value?.errorMessage === 'string' ? value.errorMessage : undefined,
    startupState,
    startupStep,
    startupUpdatedAt,
    firstCallbackAt,
  };
};

const flushWaiters = (uploadId: string, action: (waiter: UploadWaiter) => void) => {
  const waiters = waitersById.get(uploadId);
  if (!waiters?.length) {
    return;
  }

  waitersById.delete(uploadId);
  waiters.forEach(action);
};

const flushFirstCallbackWaiters = (uploadId: string) => {
  const waiters = firstCallbackWaitersById.get(uploadId);
  if (!waiters?.length) {
    return;
  }

  firstCallbackWaitersById.delete(uploadId);
  waiters.forEach((waiter) => waiter());
};

const resolveStartupTimestamps = (
  event: NativeMuxDirectUploadEvent
): Pick<NativeMuxDirectUploadRecord, 'startupUpdatedAt' | 'firstCallbackAt'> => {
  const nowIsoString = new Date().toISOString();
  return {
    firstCallbackAt: event.firstCallbackAt ?? nowIsoString,
    startupUpdatedAt: event.startupUpdatedAt ?? event.firstCallbackAt ?? nowIsoString,
  };
};

const handleNativeEvent = (rawEvent: Partial<NativeMuxDirectUploadEvent>) => {
  const event = normalizeEvent(rawEvent);
  if (!event) {
    return;
  }

  const startupTimestamps = resolveStartupTimestamps(event);

  if (event.state === 'progress') {
    uploadStateById.set(event.uploadId, {
      uploadId: event.uploadId,
      fileUri: event.fileUri,
      state: 'uploading',
      bytesUploaded: event.bytesUploaded,
      bytesTotal: event.bytesTotal,
      errorCode: undefined,
      errorMessage: undefined,
      startupState: 'active',
      startupStep: event.startupStep ?? 'first_callback_received',
      startupUpdatedAt: startupTimestamps.startupUpdatedAt,
      firstCallbackAt: startupTimestamps.firstCallbackAt,
    });
    flushFirstCallbackWaiters(event.uploadId);
    return;
  }

  if (event.state === 'success') {
    uploadStateById.set(event.uploadId, {
      uploadId: event.uploadId,
      fileUri: event.fileUri,
      state: 'success',
      bytesUploaded: event.bytesUploaded,
      bytesTotal: event.bytesTotal,
      startupState: 'terminal',
      startupStep: event.startupStep ?? 'result_success',
      startupUpdatedAt: startupTimestamps.startupUpdatedAt,
      firstCallbackAt: startupTimestamps.firstCallbackAt,
    });
    logBridge('native-terminal-event', {
      uploadId: event.uploadId,
      state: 'success',
      bytesUploaded: event.bytesUploaded,
      bytesTotal: event.bytesTotal,
    });
    flushFirstCallbackWaiters(event.uploadId);
    flushWaiters(event.uploadId, (waiter) => waiter.resolve());
    return;
  }

  const startedBytes = Number(event.bytesUploaded ?? 0) > 0;
  uploadStateById.set(event.uploadId, {
    uploadId: event.uploadId,
    fileUri: event.fileUri,
    state: 'failed',
    bytesUploaded: event.bytesUploaded,
    bytesTotal: event.bytesTotal,
    errorCode: event.errorCode,
    errorMessage: event.errorMessage,
    startupState: 'terminal',
    startupStep: event.startupStep ?? 'result_failure',
    startupUpdatedAt: startupTimestamps.startupUpdatedAt,
    firstCallbackAt: startupTimestamps.firstCallbackAt,
  });
  logBridge('native-terminal-event', {
    uploadId: event.uploadId,
    state: 'failure',
    bytesUploaded: event.bytesUploaded,
    bytesTotal: event.bytesTotal,
    errorCode: event.errorCode,
    errorMessage: event.errorMessage,
  });
  flushFirstCallbackWaiters(event.uploadId);
  flushWaiters(event.uploadId, (waiter) =>
    waiter.reject(
      new NativeMuxDirectUploadError(event.errorMessage ?? 'Native Mux upload failed.', {
        code: event.errorCode,
        startedBytes,
      })
    )
  );
};

const hasNativeModuleContract = (
  value: Partial<NativeMuxDirectUploadModule> | undefined
): value is NativeMuxDirectUploadModule =>
  Boolean(
    value &&
      typeof value.startUpload === 'function' &&
      typeof value.resumeCachedUploads === 'function' &&
      typeof value.getCachedUploads === 'function' &&
      typeof value.addListener === 'function' &&
      typeof value.removeListeners === 'function'
  );

const ensureEmitter = () => {
  if (!hasNativeModuleContract(nativeModule) || emitterSubscription) {
    return;
  }

  try {
    const emitter = new NativeEventEmitter(nativeModule as never);
    emitterSubscription = emitter.addListener(EVENT_NAME, handleNativeEvent);
    logBridge('emitter-ready');
  } catch (error) {
    logBridge('emitter-init-failed', {
      message:
        error instanceof Error
          ? error.message
          : 'Native Mux uploader event bridge is unavailable on this device.',
    });
    throw new NativeMuxDirectUploadError(
      error instanceof Error
        ? error.message
        : 'Native Mux uploader event bridge is unavailable on this device.'
    );
  }
};

const getNativeModule = () => {
  if (!hasNativeModuleContract(nativeModule)) {
    throw new NativeMuxDirectUploadError('Native Mux uploader is unavailable on this device.');
  }

  ensureEmitter();
  return nativeModule;
};

const waitForUploadTerminalState = async (uploadId: string) => {
  const current = uploadStateById.get(uploadId);
  if (current?.state === 'success') {
    return;
  }
  if (current?.state === 'failed') {
    throw new NativeMuxDirectUploadError(current.errorMessage ?? 'Native Mux upload failed.', {
      code: current.errorCode,
      startedBytes: Number(current.bytesUploaded ?? 0) > 0,
    });
  }

  await new Promise<void>((resolve, reject) => {
    const waiters = waitersById.get(uploadId) ?? [];
    waiters.push({
      resolve,
      reject,
    });
    waitersById.set(uploadId, waiters);
  });
};

const waitForUploadStartup = async (uploadId: string) => {
  const current = uploadStateById.get(uploadId);
  if (current?.firstCallbackAt || current?.state === 'success' || current?.state === 'failed') {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const onFirstCallback = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    const timeoutId = setTimeout(() => {
      const waiters = firstCallbackWaitersById.get(uploadId) ?? [];
      firstCallbackWaitersById.set(
        uploadId,
        waiters.filter((waiter) => waiter !== onFirstCallback)
      );
      logBridge('startup-timeout', { uploadId, timeoutMs: NATIVE_UPLOAD_STARTUP_TIMEOUT_MS });
      reject(
        new NativeMuxDirectUploadError(
          'Native Mux upload did not emit a callback before timing out.',
          {
            code: 'startup_timeout',
            startedBytes: false,
          }
        )
      );
    }, NATIVE_UPLOAD_STARTUP_TIMEOUT_MS);

    const waiters = firstCallbackWaitersById.get(uploadId) ?? [];
    waiters.push(onFirstCallback);
    firstCallbackWaitersById.set(uploadId, waiters);
  });
};

const parseTimestampMs = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const hasTimedOutNativeMuxStartup = (
  record?: NativeMuxDirectUploadRecord | null,
  nowMs = Date.now()
) => {
  if (
    !record ||
    record.startupState !== 'starting' ||
    record.firstCallbackAt ||
    !record.startupUpdatedAt
  ) {
    return false;
  }

  const startupUpdatedAtMs = parseTimestampMs(record.startupUpdatedAt);
  if (typeof startupUpdatedAtMs !== 'number') {
    return false;
  }

  return nowMs - startupUpdatedAtMs >= NATIVE_UPLOAD_STARTUP_TIMEOUT_MS;
};

export const isNativeMuxDirectUploadAvailable = () =>
  Platform.OS === 'ios' || Platform.OS === 'android'
    ? hasNativeModuleContract(nativeModule)
    : false;

export const startNativeMuxDirectUpload = async (params: NativeMuxDirectUploadStartParams) => {
  const module = getNativeModule();
  const startedAt = new Date().toISOString();
  uploadStateById.set(params.uploadId, {
    uploadId: params.uploadId,
    fileUri: params.fileUri,
    state: 'uploading',
    bytesUploaded: 0,
    startupState: 'starting',
    startupStep: 'js_start_requested',
    startupUpdatedAt: startedAt,
  });
  logBridge('start-upload-call', {
    uploadId: params.uploadId,
    fileUri: params.fileUri,
  });
  await module.startUpload(params);
  await waitForUploadStartup(params.uploadId);
  await waitForUploadTerminalState(params.uploadId);
};

export const resumeNativeMuxDirectUploads = async () => {
  const module = getNativeModule();
  const records = await module.resumeCachedUploads();
  logBridge('resume-cached-uploads', { count: records.length });
  return records.flatMap((record) => {
    const normalizedRecord = normalizeRecord(record);
    if (!normalizedRecord) {
      return [];
    }
    uploadStateById.set(normalizedRecord.uploadId, normalizedRecord);
    return [normalizedRecord];
  });
};

export const getNativeMuxDirectUploads = async () => {
  const module = getNativeModule();
  const records = await module.getCachedUploads();
  logBridge('get-cached-uploads', { count: records.length });
  return records.flatMap((record) => {
    const normalizedRecord = normalizeRecord(record);
    if (!normalizedRecord) {
      return [];
    }
    uploadStateById.set(normalizedRecord.uploadId, normalizedRecord);
    return [normalizedRecord];
  });
};

export const waitForNativeMuxDirectUpload = async (uploadId: string) => {
  const normalizedUploadId = uploadId.trim();
  if (!normalizedUploadId) {
    throw new NativeMuxDirectUploadError('Upload id is required.');
  }

  await waitForUploadTerminalState(normalizedUploadId);
};
