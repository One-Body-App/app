import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  createConnectPortalDraft,
  formatConnectPortalNumber,
  formatConnectPortalDateTime,
  getEventCapacityLabel,
  getEventLifecycleState,
  getEventProgressRatio,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import GoBackIcon from '@/src/components/GoBackIcon';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoEventDash'>;

const HEADER_FONT_FAMILY = 'Rubik-Bold';
const BODY_FONT_FAMILY = 'OpenSans-Regular';
const BODY_FONT_FAMILY_SEMIBOLD = 'OpenSans-SemiBold';

function EventDashboardScreen({ navigation }: Props): React.JSX.Element {
  const [refreshing, setRefreshing] = useState(false);
  const { snapshot, refresh } = useConnectPortalData();

  const summary = useMemo(
    () => ({
      featuredEvent:
        snapshot.organizerPublished.find((item) => getEventLifecycleState(item) === 'Active') ||
        snapshot.organizerPublished[0] ||
        null,
      activeEvents: snapshot.organizerPublished.filter(
        (item) => getEventLifecycleState(item) === 'Active'
      ),
      draftEvents: snapshot.drafts,
      totalRegistrations: snapshot.organizerPublished.reduce(
        (sum, item) => sum + Number(item.registrationCount || 0),
        0
      ),
      totalViews: snapshot.organizerPublished.reduce(
        (sum, item) => sum + Number(item.viewCount || 0),
        0
      ),
      totalOpens: snapshot.organizerPublished.reduce(
        (sum, item) => sum + Number(item.openCount || 0),
        0
      ),
    }),
    [snapshot.drafts, snapshot.organizerPublished]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const featuredEvent = summary?.featuredEvent ?? null;
  const activeEvents = summary?.activeEvents ?? [];
  const draftEvents = summary?.draftEvents ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleRow}>
              <View testID="event-dash-back-control">
                <GoBackIcon
                  color="#126b87"
                  goBack={() => {
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                      return;
                    }
                    navigation.navigate('ConnectGoLanding');
                  }}
                  style={styles.backButton}
                />
              </View>
              <Text style={styles.headerTitle}>
                <Text style={styles.headerTitleAccent}>Go!</Text>
                {' Events Dash'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('ConnectGoMyEvents')}
          >
            <Text style={styles.headerActionText}>My Events</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await refresh(true);
                setRefreshing(false);
              }}
            />
          }
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>REGISTRATIONS</Text>
              <Text style={styles.statValue}>
                {formatConnectPortalNumber(summary?.totalRegistrations ?? 0)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>VIEWS</Text>
              <Text style={styles.statValue}>
                {formatConnectPortalNumber(summary?.totalViews ?? 0)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>OPENS</Text>
              <Text style={styles.statValue}>
                {formatConnectPortalNumber(summary?.totalOpens ?? 0)}
              </Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardPrimary]}
              onPress={async () => {
                const draft = await createConnectPortalDraft();
                navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
              }}
            >
              <Text style={styles.actionPrimaryTitle}>New Event</Text>
              <Text style={styles.actionPrimaryBody}>Start the seven-step event flow.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ConnectGoMyEvents', { initialFilter: 'Draft' })}
            >
              <Text style={styles.actionSecondaryTitle}>Drafts</Text>
              <Text style={styles.actionSecondaryBody}>
                {draftEvents.length} saved draft{draftEvents.length === 1 ? '' : 's'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              disabled={!featuredEvent}
              onPress={() => {
                if (featuredEvent) {
                  navigation.navigate('ConnectGoEventAnalytics', { eventId: featuredEvent.id });
                }
              }}
            >
              <Text style={styles.actionSecondaryTitle}>Analytics</Text>
              <Text style={styles.actionSecondaryBody}>
                {featuredEvent ? 'Open the featured event report.' : 'No event selected yet.'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ConnectGoMyEvents')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {activeEvents.slice(0, 3).map((eventRecord) => {
            const progressPercent = Math.round(getEventProgressRatio(eventRecord) * 100);
            return (
              <View key={eventRecord.id} style={styles.eventCard}>
                <Text style={styles.eventCategory}>{eventRecord.category}</Text>
                <Text style={styles.eventTitle}>{eventRecord.title}</Text>
                <Text style={styles.eventMeta}>{formatConnectPortalDateTime(eventRecord)}</Text>
                <Text style={styles.eventMeta}>{eventRecord.venueName || eventRecord.address}</Text>

                <View style={styles.progressBlock}>
                  <View style={styles.progressHeaderRow}>
                    <Text style={styles.progressText}>{getEventCapacityLabel(eventRecord)}</Text>
                    <Text style={styles.progressText}>{progressPercent}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                  </View>
                </View>

                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={styles.eventActionPrimary}
                    onPress={() =>
                      navigation.navigate('ConnectGoEventView', { eventId: eventRecord.id })
                    }
                  >
                    <Text style={styles.eventActionPrimaryText}>Manage Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.eventActionSecondary}
                    onPress={() =>
                      navigation.navigate('ConnectGoEventAnalytics', { eventId: eventRecord.id })
                    }
                  >
                    <Text style={styles.eventActionSecondaryText}>Analytics</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
    paddingVertical: 4,
    paddingRight: 4,
  },
  headerTitle: {
    fontSize: 28,
    color: '#032f3c',
    fontFamily: HEADER_FONT_FAMILY,
    flexShrink: 1,
  },
  headerTitleAccent: {
    color: '#12D2D9',
  },
  headerAction: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
  },
  headerActionText: {
    color: '#032f3c',
    fontSize: 14,
    fontFamily: HEADER_FONT_FAMILY,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 16,
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#4F6D77',
    fontFamily: BODY_FONT_FAMILY_SEMIBOLD,
  },
  statValue: {
    fontSize: 24,
    color: '#032f3c',
    fontFamily: HEADER_FONT_FAMILY,
  },
  quickActions: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 18,
    gap: 4,
  },
  actionCardPrimary: {
    backgroundColor: '#126b87',
    borderColor: '#126b87',
  },
  actionPrimaryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: HEADER_FONT_FAMILY,
  },
  actionPrimaryBody: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: BODY_FONT_FAMILY,
  },
  actionSecondaryTitle: {
    color: '#032f3c',
    fontSize: 18,
    fontFamily: HEADER_FONT_FAMILY,
  },
  actionSecondaryBody: {
    color: '#4F6D77',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: BODY_FONT_FAMILY,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#032f3c',
    fontSize: 22,
    fontFamily: HEADER_FONT_FAMILY,
  },
  sectionLink: {
    color: '#126b87',
    fontSize: 14,
    fontFamily: BODY_FONT_FAMILY_SEMIBOLD,
  },
  eventCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 18,
    gap: 8,
  },
  eventCategory: {
    color: '#126b87',
    fontSize: 12,
    fontFamily: BODY_FONT_FAMILY_SEMIBOLD,
  },
  eventTitle: {
    color: '#032f3c',
    fontSize: 22,
    fontFamily: HEADER_FONT_FAMILY,
  },
  eventMeta: {
    color: '#4F6D77',
    fontSize: 14,
    fontFamily: BODY_FONT_FAMILY,
  },
  progressBlock: {
    gap: 8,
    marginTop: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: '#4F6D77',
    fontSize: 13,
    fontFamily: BODY_FONT_FAMILY_SEMIBOLD,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E4EDF0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#126b87',
    borderRadius: 4,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  eventActionPrimary: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#126b87',
  },
  eventActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: HEADER_FONT_FAMILY,
  },
  eventActionSecondary: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E1E5',
    backgroundColor: '#FFFFFF',
  },
  eventActionSecondaryText: {
    color: '#032f3c',
    fontSize: 15,
    fontFamily: HEADER_FONT_FAMILY,
  },
});

export default EventDashboardScreen;
