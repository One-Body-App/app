const BITRATE_PRESETS = ['low', 'normal', 'high'] as const;
const CODEC_PRESETS = ['h264', 'h265'] as const;

export type BitratePreset = (typeof BITRATE_PRESETS)[number];
export type CodecPreset = (typeof CODEC_PRESETS)[number];

export const getDefaultRecorderCaptureSettings = (platformOS: string) => ({
  videoBitRate: (platformOS === 'ios' ? 'normal' : 'high') as BitratePreset,
  videoCodec: (platformOS === 'ios' ? 'h264' : 'h265') as CodecPreset,
});

export const shouldAllowCameraFlip = ({
  isRecording,
  isTearingDown,
  hasTargetDevice,
}: {
  isRecording: boolean;
  isTearingDown: boolean;
  hasTargetDevice: boolean;
}) => !isRecording && !isTearingDown && hasTargetDevice;

export const isRecordingCanceledError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const { code } = error as { code?: unknown };
  return code === 'capture/recording-canceled' || code === 'capture/recording-cancelled';
};

const collectCameraErrorSignals = (
  error: unknown,
  seen = new Set<unknown>(),
  depth = 0
): string[] => {
  if (!error || depth > 3 || seen.has(error)) {
    return [];
  }

  if (typeof error === 'string') {
    return [error];
  }

  if (error instanceof Error) {
    seen.add(error);
    return [
      error.message,
      ...collectCameraErrorSignals((error as Error & { cause?: unknown }).cause, seen, depth + 1),
    ].filter(Boolean);
  }

  if (typeof error !== 'object') {
    return [];
  }

  seen.add(error);
  const candidate = error as Record<string, unknown>;
  const directValues = [
    candidate.code,
    candidate.message,
    candidate.description,
    candidate.localizedDescription,
    candidate.NSLocalizedDescription,
    candidate.NSLocalizedFailureReason,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return [
    ...directValues,
    ...collectCameraErrorSignals(candidate.cause, seen, depth + 1),
    ...collectCameraErrorSignals(candidate.userInfo, seen, depth + 1),
    ...collectCameraErrorSignals(candidate.nativeError, seen, depth + 1),
  ];
};

export const isNoRecordingInProgressError = (error: unknown) => {
  const normalizedSignals = collectCameraErrorSignals(error).map((value) => value.toLowerCase());
  return normalizedSignals.some(
    (value) =>
      value === 'capture/no-recording-in-progress' ||
      value.includes('no active video recording in progress') ||
      value.includes('no recording in progress')
  );
};
