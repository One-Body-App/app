import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';

export const VIDEO_UPLOAD_RESUME_DELAY_MS = 1200;

export const shouldAutoResumePendingVideoUploads = (platformOS: string) =>
  platformOS === 'ios' || platformOS === 'android';

export const shouldResumePendingVideoUploadsOnLifecycle = (items: PendingVideoUpload[]) =>
  items.some(
    (item) =>
      item.status === 'processing_remote' ||
      (item.status === 'uploading' && item.uploadTransport === 'mux_sdk')
  );

export const shouldStartPendingVideoUploadsOnRuntime = (items: PendingVideoUpload[]) =>
  items.some((item) => item.status === 'queued');

export type VideoUploadTerminalToastEvent = {
  dedupeKey: string;
  message: string;
  type: 'success' | 'danger';
};

const normalizeFailureMessage = (message?: string) => {
  const normalizedMessage = String(message ?? '').trim();
  if (!normalizedMessage) {
    return null;
  }
  if (/Command failed with state/i.test(normalizedMessage)) {
    return 'Your Watch video could not be processed after editing. Please try again.';
  }
  return normalizedMessage;
};

export const getPendingVideoUploadToastEvent = (
  item: PendingVideoUpload
): VideoUploadTerminalToastEvent | null => {
  if (item.status === 'complete') {
    return {
      dedupeKey: `${item.id}:complete`,
      message:
        item.watchProcessingStatus === 'FAILED_REVIEW'
          ? 'Your Watch video was submitted for review.'
          : 'Your Watch video is live.',
      type: 'success',
    };
  }

  if (item.status !== 'failed') {
    return null;
  }

  const failureMessages: Record<string, string> = {
    'nsfw-blocked': 'This video violates content standards and cannot be posted to Watch.',
    'moderation-failed': 'Your Watch video could not be reviewed locally. Please try again.',
    'missing-source':
      'Your Watch video could not be completed because the original file is no longer available.',
    'invalid-edit':
      'Your Watch video could not be processed because the trim or crop settings were invalid.',
    network: 'Your Watch video upload did not finish. Please try again.',
  };
  const fallbackMessage =
    (item.failureCode ? failureMessages[item.failureCode] : undefined) ??
    'Your Watch video could not be processed after editing. Please try again.';

  return {
    dedupeKey: `${item.id}:failed`,
    message: normalizeFailureMessage(item.lastError) ?? fallbackMessage,
    type: 'danger',
  };
};

export const collectPendingVideoUploadToastEvents = (
  items: PendingVideoUpload[],
  deliveredKeys: Set<string>
) => {
  const events: VideoUploadTerminalToastEvent[] = [];

  items.forEach((item) => {
    const event = getPendingVideoUploadToastEvent(item);
    if (!event || deliveredKeys.has(event.dedupeKey)) {
      return;
    }
    deliveredKeys.add(event.dedupeKey);
    events.push(event);
  });

  return events;
};
