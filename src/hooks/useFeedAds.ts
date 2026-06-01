import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import useMountEffect from '@/src/hooks/useMountEffect';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { getInlineAdId, type InlineAd } from '@/components/ads/InlineAdCard';

/**
 * Fetches sponsored inline ads (GET /ads/serve?zone=feed_inline) once on mount and
 * exposes the ads plus an interleave helper that inserts an ad sentinel after every
 * Nth feed item (cycling through the fetched ads).
 *
 * Kept intentionally additive so the feed reducer/saga logic is untouched.
 */

export const INLINE_AD_ZONE = 'feed_inline';
export const DEFAULT_AD_INTERVAL = 6;

// Sentinel wrapper the feed list detects and renders as an InlineAdCard.
export interface InlineAdEntry {
  __inlineAd: true;
  ad: InlineAd;
  /** Stable key for list rendering (adId + slot). */
  adKey: string;
}

export const isInlineAdEntry = (entry: unknown): entry is InlineAdEntry =>
  Boolean(entry) && typeof entry === 'object' && (entry as InlineAdEntry).__inlineAd === true;

const normalizeAd = (raw: unknown): InlineAd | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const ad = raw as InlineAd;
  return getInlineAdId(ad) ? ad : null;
};

const extractAdsArray = (payload: unknown): InlineAd[] => {
  let source: unknown[] = [];
  if (Array.isArray(payload)) {
    source = payload;
  } else if (Array.isArray((payload as { data?: unknown })?.data)) {
    source = (payload as { data: unknown[] }).data;
  } else if (Array.isArray((payload as { content?: unknown })?.content)) {
    source = (payload as { content: unknown[] }).content;
  }
  return source.map(normalizeAd).filter((ad): ad is InlineAd => ad !== null);
};

export function useFeedAds() {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [ads, setAds] = useState<InlineAd[]>([]);

  useMountEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ApiCall<unknown>({
          route: `ads/serve?zone=${INLINE_AD_ZONE}`,
          verb: 'get',
          token: token ?? true,
          suppressErrorLog: true,
        });
        if (!cancelled && res?.status === 200) {
          setAds(extractAdsArray(res.response));
        }
      } catch {
        // Best-effort; ads are non-critical.
      }
    })();
    return () => {
      cancelled = true;
    };
  });

  /**
   * Returns a new array with an InlineAdEntry inserted after every `interval`-th
   * item, cycling through the fetched ads. Original items are left untouched.
   * When there are no ads (or too few items), the input array is returned as-is.
   */
  const interleaveAds = useCallback(
    <T>(data: T[], interval: number = DEFAULT_AD_INTERVAL): Array<T | InlineAdEntry> => {
      if (!ads.length || !Array.isArray(data) || data.length < interval) {
        return data;
      }
      const result: Array<T | InlineAdEntry> = [];
      let adCursor = 0;
      data.forEach((item, index) => {
        result.push(item);
        if ((index + 1) % interval === 0) {
          const ad = ads[adCursor % ads.length];
          adCursor += 1;
          result.push({
            __inlineAd: true,
            ad,
            adKey: `${getInlineAdId(ad)}-${index + 1}`,
          });
        }
      });
      return result;
    },
    [ads]
  );

  return { ads, interleaveAds };
}

export default useFeedAds;
