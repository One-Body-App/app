import type { ClientTextModerationScores } from './types';

export type TextModerationBridgeResult = {
  scores: ClientTextModerationScores;
  moderationError?: string;
};

type TextModerationRequest = {
  id: string;
  text: string;
};

type DispatchHandler = (request: TextModerationRequest) => void;

let dispatchHandler: DispatchHandler | null = null;
let inFlightRequestId: string | null = null;
const queuedRequests: TextModerationRequest[] = [];
const pendingResolvers = new Map<
  string,
  {
    resolve: (result: TextModerationBridgeResult) => void;
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

export const registerTextModerationBridge = (handler: DispatchHandler) => {
  dispatchHandler = handler;
  flushNextRequest();
};

export const unregisterTextModerationBridge = (handler: DispatchHandler) => {
  if (dispatchHandler === handler) {
    dispatchHandler = null;
  }
};

export const requestTextModeration = (text: string) =>
  new Promise<TextModerationBridgeResult>((resolve, reject) => {
    const id = `text_moderation_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    pendingResolvers.set(id, { resolve, reject });
    queuedRequests.push({ id, text });
    flushNextRequest();
  });

export const resolveTextModerationRequest = (
  requestId: string,
  result: TextModerationBridgeResult
) => {
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

export const rejectTextModerationRequest = (requestId: string, error: Error) => {
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
