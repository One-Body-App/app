import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, ActionSheetIOS, Alert, Platform } from 'react-native';
import VisibilitySensor from '@svanboxel/visibility-sensor-react-native';

import StyledText from '@/components/styled/Text';
import { ApiCall } from '@/services/api';
import { OpenURLButton } from '@/services/constants';

/**
 * Sponsored "InlineAdCard" rendered inside the scrolling feed.
 *
 * Two formats (driven by `ad.format`, default 'square'):
 *   - 'banner': slim rectangle (small) — short fixed-height strip.
 *   - 'square': 1x1 card — square image with a title.
 * Looks like a native feed card (white, border #cdd5d8, radius 8) on a subtle
 * sponsored band. "Promoted" badge (bg #d0f6f7, text #126b87), title #032f3c.
 *
 * - Fires POST /ads/:id/impression once when the card scrolls into view (deduped
 *   per ad/session) via the VisibilitySensor onChange callback (no useEffect:
 *   the app blocks importing useEffect).
 * - On tap: opens a native picker (View site / Report ad). "View site" fires
 *   POST /ads/:id/click then opens targetUrl; "Report ad" fires POST /ads/:id/report.
 * - A small "Advertise with us" link opens the advertiser portal.
 */

export type AdFormat = 'banner' | 'square';

export interface InlineAd {
  _id?: string;
  id?: string;
  title?: string;
  imageUrl?: string;
  targetUrl?: string;
  zone?: string;
  format?: AdFormat;
}

// TODO: move to env (react-native-config). Public advertiser portal URL.
const ADVERTISER_PORTAL_URL = 'https://advertise.onebodyapp.com';

interface InlineAdCardProps {
  ad: InlineAd;
  /** Auth token from redux (state.auth.userToken). Optional; ApiCall resolves a managed token too. */
  token?: string | null;
}

// Module-level dedupe so a given ad reports at most one impression per app session,
// regardless of how many times its card mounts or scrolls back into view.
const reportedImpressions = new Set<string>();

export const getInlineAdId = (ad: InlineAd | null | undefined): string =>
  String(ad?._id ?? ad?.id ?? '');

function InlineAdCard({ ad, token }: InlineAdCardProps): React.ReactElement | null {
  const adId = getInlineAdId(ad);
  const format: AdFormat = ad?.format ?? 'square';
  const isBanner = format === 'banner';
  const hasFiredImpressionRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const fireImpression = useCallback(() => {
    if (!adId || hasFiredImpressionRef.current || reportedImpressions.has(adId)) {
      return;
    }
    hasFiredImpressionRef.current = true;
    reportedImpressions.add(adId);
    ApiCall({
      route: `ads/${adId}/impression`,
      verb: 'post',
      token: token ?? true,
      suppressErrorLog: true,
    }).catch(() => {
      // Best-effort beacon; ignore failures.
      reportedImpressions.delete(adId);
      hasFiredImpressionRef.current = false;
    });
  }, [adId, token]);

  const handleVisibilityChange = useCallback(
    (isVisible: boolean) => {
      if (isVisible) {
        fireImpression();
      }
    },
    [fireImpression]
  );

  const openSite = useCallback(async () => {
    if (adId) {
      // Fire the click beacon first, then open the destination.
      try {
        await ApiCall({
          route: `ads/${adId}/click`,
          verb: 'post',
          token: token ?? true,
          suppressErrorLog: true,
        });
      } catch {
        // Ignore click-beacon failures; still open the destination.
      }
    }
    if (ad?.targetUrl) {
      OpenURLButton(ad.targetUrl);
    }
  }, [ad?.targetUrl, adId, token]);

  const reportAd = useCallback(() => {
    if (adId) {
      ApiCall({
        route: `ads/${adId}/report`,
        verb: 'post',
        token: token ?? true,
        suppressErrorLog: true,
      }).catch(() => {
        // Best-effort; ignore failures.
      });
    }
    Alert.alert('Thanks for reporting', 'Our team will review this ad.');
  }, [adId, token]);

  // Tapping the ad opens a native picker: view the site or report the ad.
  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['View site', 'Report ad', 'Cancel'],
          cancelButtonIndex: 2,
          destructiveButtonIndex: 1,
          title: ad?.title ?? 'Sponsored',
        },
        (index) => {
          if (index === 0) {
            openSite();
          } else if (index === 1) {
            reportAd();
          }
        }
      );
    } else {
      Alert.alert('Sponsored', ad?.title ?? 'Advertisement', [
        { text: 'View site', onPress: openSite },
        { text: 'Report ad', style: 'destructive', onPress: reportAd },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [ad?.title, openSite, reportAd]);

  if (!ad || (!ad.imageUrl && !ad.title)) {
    return null;
  }

  return (
    <VisibilitySensor onChange={handleVisibilityChange}>
      <View style={styles.band}>
        <Pressable
          onPress={handlePress}
          onPressIn={() => setIsPressing(true)}
          onPressOut={() => setIsPressing(false)}
          style={[styles.card, isPressing && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={ad.title ? `Sponsored: ${ad.title}` : 'Sponsored'}
        >
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <StyledText style={styles.badgeText}>Promoted</StyledText>
            </View>
            <Pressable onPress={() => OpenURLButton(ADVERTISER_PORTAL_URL)} hitSlop={8}>
              <StyledText style={styles.advertise}>Advertise with us</StyledText>
            </Pressable>
          </View>

          {!isBanner && ad.title ? (
            <StyledText numberOfLines={3} style={styles.title}>
              {ad.title}
            </StyledText>
          ) : null}

          {ad.imageUrl ? (
            <Image
              source={{ uri: ad.imageUrl }}
              contentFit="cover"
              style={isBanner ? styles.bannerImage : styles.squareImage}
            />
          ) : null}
        </Pressable>
      </View>
    </VisibilitySensor>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: '#eef2f4',
    paddingVertical: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#cdd5d8',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#d0f6f7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#126b87',
    fontSize: 11,
    fontWeight: '700',
  },
  advertise: {
    color: '#68828a',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: '#032f3c',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  // 1x1 square card.
  squareImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: '#e6eaec',
  },
  // Slim rectangle (small).
  bannerImage: {
    width: '100%',
    height: 72,
    borderRadius: 6,
    backgroundColor: '#e6eaec',
  },
});

export default InlineAdCard;
