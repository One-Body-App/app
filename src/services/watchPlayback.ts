import { ApiCall } from '@/services/api';

type WatchPlaybackResponse = {
  mediaUrl?: string;
  thumbnailUrl?: string;
};

const playbackCache = new Map<string, WatchPlaybackResponse>();

export const getSignedWatchPlayback = async (playBackId: string) => {
  const normalizedPlaybackId = String(playBackId || '').trim();
  if (!normalizedPlaybackId) {
    return null;
  }

  const cached = playbackCache.get(normalizedPlaybackId);
  if (cached) {
    return cached;
  }

  const response = await ApiCall<WatchPlaybackResponse>({
    route: `watch/playback/${encodeURIComponent(normalizedPlaybackId)}`,
    verb: 'get',
    token: true,
  });

  if (response.status !== 200) {
    return null;
  }

  playbackCache.set(normalizedPlaybackId, response.response);
  return response.response;
};

export const clearSignedWatchPlaybackCache = () => {
  playbackCache.clear();
};
