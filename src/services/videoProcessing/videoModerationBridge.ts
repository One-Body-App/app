import type { ClientModerationDecision, ClientModerationScores } from './types';

export type VideoModerationResult = {
  moderationDecision: ClientModerationDecision;
  moderationScores: ClientModerationScores | null;
  moderationError?: string;
};

type VideoModerationRequest = {
  id: string;
  frameDataUris: string[];
};

type DispatchHandler = (request: VideoModerationRequest) => void;

const MODERATION_TIMEOUT_MS = 30_000;

let dispatchHandler: DispatchHandler | null = null;
let inFlightRequestId: string | null = null;
const queuedRequests: VideoModerationRequest[] = [];
const pendingResolvers = new Map<
  string,
  {
    resolve: (result: VideoModerationResult) => void;
    reject: (error: Error) => void;
  }
>();

const flushNextRequest = () => {
  if (!dispatchHandler || inFlightRequestId || queuedRequests.length === 0) {
    return;
  }

  const nextRequest = queuedRequests.shift();
  if (!nextRequest) {
    return;
  }

  inFlightRequestId = nextRequest.id;
  dispatchHandler(nextRequest);
};

export const registerVideoModerationBridge = (handler: DispatchHandler) => {
  dispatchHandler = handler;
  flushNextRequest();
};

export const unregisterVideoModerationBridge = (handler: DispatchHandler) => {
  if (dispatchHandler === handler) {
    dispatchHandler = null;
  }
};

export const requestVideoModeration = (frameDataUris: string[]) =>
  new Promise<VideoModerationResult>((resolve, reject) => {
    const id = `video_moderation_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    pendingResolvers.set(id, { resolve, reject });
    queuedRequests.push({ id, frameDataUris });
    flushNextRequest();

    setTimeout(() => {
      if (!pendingResolvers.has(id)) {
        return;
      }
      pendingResolvers.delete(id);
      const queueIndex = queuedRequests.findIndex((r) => r.id === id);
      if (queueIndex !== -1) {
        queuedRequests.splice(queueIndex, 1);
      }
      if (inFlightRequestId === id) {
        inFlightRequestId = null;
        flushNextRequest();
      }
      reject(new Error('Video moderation timed out.'));
    }, MODERATION_TIMEOUT_MS);
  });

export const resolveVideoModerationRequest = (requestId: string, result: VideoModerationResult) => {
  const resolver = pendingResolvers.get(requestId);
  if (inFlightRequestId === requestId) {
    inFlightRequestId = null;
  }
  if (!resolver) {
    flushNextRequest();
    return;
  }

  pendingResolvers.delete(requestId);
  resolver.resolve(result);
  flushNextRequest();
};

export const rejectVideoModerationRequest = (requestId: string, error: Error) => {
  const resolver = pendingResolvers.get(requestId);
  if (inFlightRequestId === requestId) {
    inFlightRequestId = null;
  }
  if (!resolver) {
    flushNextRequest();
    return;
  }

  pendingResolvers.delete(requestId);
  resolver.reject(error);
  flushNextRequest();
};
