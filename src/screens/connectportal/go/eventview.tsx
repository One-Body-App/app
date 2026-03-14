import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  formatConnectPortalDate,
  getConnectPortalEventById,
  getDraftResumeRouteName,
  trackConnectPortalEventTelemetry,
} from '@/src/services/connectPortal';
import type { ConnectPortalEventRecord } from '@/src/services/connectPortal';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoEventView'>;

function EventViewScreen({ navigation, route }: Props): React.JSX.Element {
  const [eventRecord, setEventRecord] = useState<ConnectPortalEventRecord | null>(null);

  useEffect(() => {
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
  }, [route.params.eventId]);

  const heroImageUri =
    eventRecord?.heroImageUri ||
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground source={{ uri: heroImageUri }} style={styles.heroImage}>
            <View style={styles.heroOverlay} />
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                <Text style={styles.headerButtonText}>Back</Text>
              </TouchableOpacity>
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
              <Text style={styles.infoValue}>
                {eventRecord
                  ? `${formatConnectPortalDate(eventRecord.startDate)}${eventRecord.startTime ? ` • ${eventRecord.startTime}` : ''}`
                  : 'TBD'}
              </Text>
              {eventRecord?.endTime ? (
                <Text style={styles.infoSubvalue}>Ends {eventRecord.endTime}</Text>
              ) : null}
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {eventRecord?.isOnline ? 'Online Event' : eventRecord?.venueName || 'Location TBD'}
              </Text>
              <Text style={styles.infoSubvalue}>
                {eventRecord?.address || eventRecord?.locationQuery || 'Address TBD'}
              </Text>
            </View>

            <View style={styles.organizerCard}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>OB</Text>
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

        <View style={styles.bottomBar}>
          {eventRecord?.status === 'draft' ? (
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() =>
                navigation.navigate(getDraftResumeRouteName(eventRecord), {
                  draftId: eventRecord.id,
                })
              }
            >
              <Text style={styles.bottomButtonText}>Resume Draft</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.bottomButton} activeOpacity={0.92}>
              <Text style={styles.bottomButtonText}>Register Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    height: 320,
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
    paddingTop: 16,
  },
  headerButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  headerButtonText: {
    color: '#032f3c',
    fontSize: 15,
    fontWeight: '700',
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
    paddingBottom: 24,
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
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default EventViewScreen;
