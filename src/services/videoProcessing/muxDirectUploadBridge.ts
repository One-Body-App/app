import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type NativeMuxDirectUploadState = 'uploading' | 'paused' | 'failed' | 'success';

export type NativeMuxDirectUploadRecord = {
  uploadId: string;
  fileUri?: string;
  state: NativeMuxDirectUploadState;
  bytesUploaded?: number;
  bytesTotal?: number;
  errorCode?: string;
  errorMessage?: string;
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

type NativeMuxDirectUploadEvent = NativeMuxDirectUploadRecord & {
  state: 'progress' | 'success' | 'failure';
};

type UploadWaiter = {
  resolve: () => void;
  reject: (error: NativeMuxDirectUploadError) => void;
};

const EVENT_NAME = 'muxDirectUploadEvent';

const nativeModule = NativeModules.MuxDirectUpload as
  | Partial<NativeMuxDirectUploadModule>
  | undefined;

const uploadStateById = new Map<string, NativeMuxDirectUploadRecord>();
const waitersById = new Map<string, UploadWaiter[]>();
let emitterSubscription:
  | {
      remove: () => void;
    }
  | undefined;

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

  return {
    uploadId,
    fileUri:
      typeof value?.fileUri === 'string' && value.fileUri.trim() !== '' ? value.fileUri : undefined,
    state,
    bytesUploaded: typeof value?.bytesUploaded === 'number' ? value.bytesUploaded : undefined,
    bytesTotal: typeof value?.bytesTotal === 'number' ? value.bytesTotal : undefined,
    errorCode: typeof value?.errorCode === 'string' ? value.errorCode : undefined,
    errorMessage: typeof value?.errorMessage === 'string' ? value.errorMessage : undefined,
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

  return {
    uploadId,
    fileUri:
      typeof value?.fileUri === 'string' && value.fileUri.trim() !== '' ? value.fileUri : undefined,
    state,
    bytesUploaded: typeof value?.bytesUploaded === 'number' ? value.bytesUploaded : undefined,
    bytesTotal: typeof value?.bytesTotal === 'number' ? value.bytesTotal : undefined,
    errorCode: typeof value?.errorCode === 'string' ? value.errorCode : undefined,
    errorMessage: typeof value?.errorMessage === 'string' ? value.errorMessage : undefined,
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

const handleNativeEvent = (rawEvent: Partial<NativeMuxDirectUploadEvent>) => {
  const event = normalizeEvent(rawEvent);
  if (!event) {
    return;
  }

  if (event.state === 'progress') {
    uploadStateById.set(event.uploadId, {
      uploadId: event.uploadId,
      fileUri: event.fileUri,
      state: 'uploading',
      bytesUploaded: event.bytesUploaded,
      bytesTotal: event.bytesTotal,
      errorCode: undefined,
      errorMessage: undefined,
    });
    return;
  }

  if (event.state === 'success') {
    uploadStateById.set(event.uploadId, {
      uploadId: event.uploadId,
      fileUri: event.fileUri,
      state: 'success',
      bytesUploaded: event.bytesUploaded,
      bytesTotal: event.bytesTotal,
    });
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
  });
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
  } catch (error) {
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

export const isNativeMuxDirectUploadAvailable = () =>
  Platform.OS === 'ios' || Platform.OS === 'android'
    ? hasNativeModuleContract(nativeModule)
    : false;

export const startNativeMuxDirectUpload = async (params: NativeMuxDirectUploadStartParams) => {
  const module = getNativeModule();
  uploadStateById.set(params.uploadId, {
    uploadId: params.uploadId,
    fileUri: params.fileUri,
    state: 'uploading',
    bytesUploaded: 0,
  });
  await module.startUpload(params);
  await waitForUploadTerminalState(params.uploadId);
};

export const resumeNativeMuxDirectUploads = async () => {
  const module = getNativeModule();
  const records = await module.resumeCachedUploads();
  return records
    .map((record) => normalizeRecord(record))
    .filter(Boolean)
    .map((record) => {
      uploadStateById.set(record!.uploadId, record!);
      return record!;
    });
};

export const getNativeMuxDirectUploads = async () => {
  const module = getNativeModule();
  const records = await module.getCachedUploads();
  return records
    .map((record) => normalizeRecord(record))
    .filter(Boolean)
    .map((record) => {
      uploadStateById.set(record!.uploadId, record!);
      return record!;
    });
};

export const waitForNativeMuxDirectUpload = async (uploadId: string) => {
  const normalizedUploadId = uploadId.trim();
  if (!normalizedUploadId) {
    throw new NativeMuxDirectUploadError('Upload id is required.');
  }

  await waitForUploadTerminalState(normalizedUploadId);
};
