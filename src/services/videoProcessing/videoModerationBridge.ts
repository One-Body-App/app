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
  });

export const resolveVideoModerationRequest = (requestId: string, result: VideoModerationResult) => {
  const resolver = pendingResolvers.get(requestId);
  if (!resolver) {
    inFlightRequestId = null;
    flushNextRequest();
    return;
  }

  pendingResolvers.delete(requestId);
  inFlightRequestId = null;
  resolver.resolve(result);
  flushNextRequest();
};

export const rejectVideoModerationRequest = (requestId: string, error: Error) => {
  const resolver = pendingResolvers.get(requestId);
  if (!resolver) {
    inFlightRequestId = null;
    flushNextRequest();
    return;
  }

  pendingResolvers.delete(requestId);
  inFlightRequestId = null;
  resolver.reject(error);
  flushNextRequest();
};
