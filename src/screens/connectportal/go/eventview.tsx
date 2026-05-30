import React, { useState } from 'react';
import { ImageBackground } from 'expo-image';
import { Alert, Linking, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  formatConnectPortalDate,
  getConnectPortalEventById,
  getDraftResumeRouteName,
  trackConnectPortalEventTelemetry,
} from '@/src/services/connectPortal';
import type { ConnectPortalEventRecord } from '@/src/services/connectPortal';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectGoEventView'>;
const STOCK_EVENT_IMAGE_URI =
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80';
const BASE_HERO_IMAGE_HEIGHT = 320;
const HEADER_TOP_SPACING = 16;
const BOTTOM_BAR_PADDING_BOTTOM = 24;

const isValidExternalLink = (value?: string) => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const getHeroImageUri = (eventRecord: ConnectPortalEventRecord | null) =>
  eventRecord?.heroImageUri || eventRecord?.photoUri || STOCK_EVENT_IMAGE_URI;

const getOrganizerInitials = (organizerName?: string) => {
  const trimmedName = String(organizerName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (trimmedName.length === 0) {
    return 'OB';
  }

  return trimmedName
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('');
};

const getDateAndTimeCopy = (eventRecord: ConnectPortalEventRecord | null) => {
  if (!eventRecord) {
    return {
      primary: 'TBD',
      secondary: '',
    };
  }

  const primary = `${formatConnectPortalDate(eventRecord.startDate)}${
    eventRecord.startTime ? ` • ${eventRecord.startTime}` : ''
  }`;
  const isMultiDay =
    Boolean(eventRecord.endDate) &&
    eventRecord.endDate !== eventRecord.startDate &&
    !eventRecord.isSingleDayEvent;

  if (isMultiDay) {
    return {
      primary,
      secondary: `${formatConnectPortalDate(eventRecord.endDate)}${
        eventRecord.endTime ? ` • ${eventRecord.endTime}` : ''
      }`,
    };
  }

  return {
    primary,
    secondary: eventRecord.endTime ? `Ends ${eventRecord.endTime}` : '',
  };
};

const getLocationCopy = (eventRecord: ConnectPortalEventRecord | null) => {
  if (!eventRecord) {
    return {
      primary: 'Location TBD',
      secondary: 'Address TBD',
    };
  }

  if (eventRecord.isOnline) {
    return {
      primary: 'Online Event',
      secondary:
        eventRecord.onlineEventUrl ||
        eventRecord.externalEventUrl ||
        eventRecord.locationQuery ||
        'Join link TBD',
    };
  }

  return {
    primary: eventRecord.venueName || eventRecord.address || 'Location TBD',
    secondary: eventRecord.address || eventRecord.locationQuery || 'Address TBD',
  };
};

function EventViewScreen({ navigation, route }: Props): React.JSX.Element {
  const [eventRecord, setEventRecord] = useState<ConnectPortalEventRecord | null>(null);
  const insets = useSafeAreaInsets();

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      const nextRecord = await getConnectPortalEventById(route.params.eventId);
      if (isActive) {
        setEventRecord(nextRecord);
      }
      if (nextRecord?.status === 'published') {
        trackConnectPortalEventTelemetry(route.params.eventId, 'detail_view', {
          source: 'connect_event_view',
        }).catch(() => {});
      }
    })();

    return () => {
      isActive = false;
    };
  });

  const heroImageUri = getHeroImageUri(eventRecord);
  const isExternalLinkEvent =
    eventRecord?.status === 'published' && eventRecord.ticketType === 'external';
  const hasExternalLink = isValidExternalLink(eventRecord?.externalEventUrl);
  const dateAndTimeCopy = getDateAndTimeCopy(eventRecord);
  const locationCopy = getLocationCopy(eventRecord);
  const organizerInitials = getOrganizerInitials(eventRecord?.organizerName);

  function renderBottomAction() {
    if (eventRecord?.status === 'draft') {
      return (
        <Pressable
          style={styles.bottomButton}
          testID="connect-event-primary-action"
          onPress={() =>
            navigation.navigate(getDraftResumeRouteName(eventRecord), {
              draftId: eventRecord.id,
            })
          }
        >
          <Text style={styles.bottomButtonText}>Resume Draft</Text>
        </Pressable>
      );
    }

    if (isExternalLinkEvent) {
      return (
        <Pressable
          style={[
            styles.bottomButton,
            styles.bottomButtonPublished,
            !hasExternalLink ? styles.bottomButtonDisabled : null,
          ]}
          disabled={!hasExternalLink}
          testID="connect-event-primary-action"
          onPress={async () => {
            if (!eventRecord?.externalEventUrl) {
              return;
            }

            try {
              await Linking.openURL(eventRecord.externalEventUrl);
            } catch {
              Alert.alert('Unable to open link', 'Please try again later.');
            }
          }}
        >
          <Text style={[styles.bottomButtonText, styles.bottomButtonTextPublished]}>Go!</Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        style={[styles.bottomButton, styles.bottomButtonPublished]}
        testID="connect-event-primary-action"
      >
        <Text style={[styles.bottomButtonText, styles.bottomButtonTextPublished]}>Go!</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            source={{ uri: heroImageUri }}
            style={[styles.heroImage, { height: BASE_HERO_IMAGE_HEIGHT + insets.top }]}
            testID="connect-event-hero-image"
          >
            <View style={styles.heroOverlay} />
            <View
              style={[styles.headerRow, { paddingTop: insets.top + HEADER_TOP_SPACING }]}
              testID="connect-event-header-row"
            >
              <Pressable
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
                testID="connect-event-back-button"
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={22} color="#032f3c" />
              </Pressable>
              <View style={styles.headerButtonSpacer} />
            </View>
          </ImageBackground>

          <View style={styles.contentCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {eventRecord?.category || eventRecord?.eventType || 'EVENT'}
              </Text>
            </View>

            <Text style={styles.title}>{eventRecord?.title || 'Event not found'}</Text>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>{dateAndTimeCopy.primary}</Text>
              {dateAndTimeCopy.secondary ? (
                <Text style={styles.infoSubvalue}>{dateAndTimeCopy.secondary}</Text>
              ) : null}
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{locationCopy.primary}</Text>
              <Text style={styles.infoSubvalue}>{locationCopy.secondary}</Text>
            </View>

            <View style={styles.organizerCard}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{organizerInitials}</Text>
              </View>
              <View style={styles.organizerCopy}>
                <Text style={styles.organizerName}>{eventRecord?.organizerName || 'OneBody'}</Text>
                <Text style={styles.organizerRole}>
                  {eventRecord?.organizerRole || 'Event Organizer'}
                </Text>
              </View>
            </View>

            <Text style={styles.aboutTitle}>About the Event</Text>
            <Text style={styles.aboutBody}>
              {eventRecord?.description || 'This event does not have a description yet.'}
            </Text>
          </View>
        </ScrollView>

        <View
          style={[styles.bottomBar, { paddingBottom: BOTTOM_BAR_PADDING_BOTTOM + insets.bottom }]}
          testID="connect-event-bottom-bar"
        >
          {renderBottomAction()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroImage: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    minHeight: 42,
    minWidth: 42,
    paddingHorizontal: 10,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  headerButtonSpacer: {
    width: 42,
  },
  contentCard: {
    marginHorizontal: 16,
    marginTop: -44,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 20,
    gap: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EAF5F7',
  },
  categoryBadgeText: {
    color: '#126b87',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#032f3c',
  },
  infoBlock: {
    gap: 4,
  },
  infoLabel: {
    color: '#126b87',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#032f3c',
    fontSize: 17,
    fontWeight: '700',
  },
  infoSubvalue: {
    color: '#4F6D77',
    fontSize: 14,
    lineHeight: 20,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    backgroundColor: '#F6FBFC',
    padding: 16,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDEEF2',
  },
  avatarText: {
    color: '#126b87',
    fontSize: 14,
    fontWeight: '800',
  },
  organizerCopy: {
    flex: 1,
  },
  organizerName: {
    color: '#032f3c',
    fontSize: 16,
    fontWeight: '700',
  },
  organizerRole: {
    color: '#4F6D77',
    fontSize: 14,
  },
  aboutTitle: {
    color: '#032f3c',
    fontSize: 22,
    fontWeight: '800',
  },
  aboutBody: {
    color: '#4F6D77',
    fontSize: 15,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F6F7F8',
    borderTopWidth: 1,
    borderTopColor: '#E6EAEC',
  },
  bottomButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#126b87',
  },
  bottomButtonPublished: {
    borderRadius: 27,
  },
  bottomButtonDisabled: {
    opacity: 0.45,
  },
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bottomButtonTextPublished: {
    fontSize: 22,
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
});

export default EventViewScreen;
