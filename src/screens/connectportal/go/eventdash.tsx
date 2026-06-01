import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  createConnectPortalDraft,
  formatConnectPortalNumber,
  formatConnectPortalDateTime,
  getEventCapacityLabel,
  getEventLifecycleState,
  getEventProgressRatio,
  isApprovedConnectCreator,
  setConnectPortalEventGoing,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { RootState } from '@/src/redux/reducers/rootReducer';
import GoBackIcon from '@/src/components/GoBackIcon';
import { useConnectPalette } from '../shared';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectGoEventDash'>;

const HEADER_FONT_FAMILY = 'Rubik-Bold';
const BODY_FONT_FAMILY = 'OpenSans-Regular';
const BODY_FONT_FAMILY_SEMIBOLD = 'OpenSans-SemiBold';

function createStyles(dark: boolean, palette: ReturnType<typeof useConnectPalette>) {
  const accent = '#126b87';
  const accentLight = '#12D2D9';

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.screenBackground,
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
    headerIOS: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    backButtonAbsolute: {
      position: 'absolute',
      left: 16,
      zIndex: 1,
    },
    headerTitleCentered: {
      textAlign: 'center',
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
      color: palette.textPrimary,
      fontFamily: HEADER_FONT_FAMILY,
      flexShrink: 1,
    },
    headerTitleAccent: {
      color: accentLight,
      fontStyle: 'italic',
    },
    headerAction: {
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
    },
    headerActionText: {
      color: palette.textPrimary,
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
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 16,
      gap: 8,
    },
    statLabel: {
      fontSize: 12,
      color: palette.textSecondary,
      fontFamily: BODY_FONT_FAMILY_SEMIBOLD,
    },
    statValue: {
      fontSize: 24,
      color: palette.textPrimary,
      fontFamily: HEADER_FONT_FAMILY,
    },
    quickActions: {
      gap: 12,
    },
    actionCard: {
      borderRadius: 18,
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 18,
      gap: 4,
    },
    actionCardPrimary: {
      backgroundColor: accent,
      borderColor: accent,
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
      color: palette.textPrimary,
      fontSize: 18,
      fontFamily: HEADER_FONT_FAMILY,
    },
    actionSecondaryBody: {
      color: palette.textSecondary,
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
      color: palette.textPrimary,
      fontSize: 22,
      fontFamily: HEADER_FONT_FAMILY,
    },
    sectionLink: {
      color: accent,
      fontSize: 14,
      fontFamily: BODY_FONT_FAMILY_SEMIBOLD,
    },
    eventCard: {
      borderRadius: 20,
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 18,
      gap: 8,
    },
    eventCategory: {
      color: dark ? accentLight : accent,
      fontSize: 12,
      fontFamily: BODY_FONT_FAMILY_SEMIBOLD,
    },
    eventTitle: {
      color: palette.textPrimary,
      fontSize: 22,
      fontFamily: HEADER_FONT_FAMILY,
    },
    eventMeta: {
      color: palette.textSecondary,
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
      color: palette.textSecondary,
      fontSize: 13,
      fontFamily: BODY_FONT_FAMILY_SEMIBOLD,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: dark ? 'rgba(255,255,255,0.1)' : '#E4EDF0',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: dark ? accentLight : accent,
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
      backgroundColor: accent,
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
      borderColor: palette.border,
      backgroundColor: palette.inputBg,
    },
    eventActionSecondaryText: {
      color: palette.textPrimary,
      fontSize: 15,
      fontFamily: HEADER_FONT_FAMILY,
    },
    emptyCard: {
      borderRadius: 20,
      backgroundColor: palette.inputBg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 22,
      gap: 8,
    },
    emptyTitle: {
      color: palette.textPrimary,
      fontSize: 20,
      fontFamily: HEADER_FONT_FAMILY,
    },
    emptyBody: {
      color: palette.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BODY_FONT_FAMILY,
    },
  });
}

function EventDashboardScreen({ navigation }: Props): React.JSX.Element {
  const [refreshing, setRefreshing] = useState(false);
  const { snapshot, refresh } = useConnectPortalData();
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const { dark } = useTheme();
  const palette = useConnectPalette();
  const isCreator = isApprovedConnectCreator(currentUser);

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

  const goingSummary = useMemo(
    () => ({
      goingEvents: snapshot.goingPublished,
      onlineEvents: snapshot.goingPublished.filter((item) => item.isOnline),
      upcomingEvents: snapshot.goingPublished.filter(
        (item) => getEventLifecycleState(item) === 'Active'
      ),
    }),
    [snapshot.goingPublished]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const styles = useMemo(() => createStyles(dark, palette), [dark, palette]);

  const featuredEvent = summary?.featuredEvent ?? null;
  const activeEvents = summary?.activeEvents ?? [];
  const draftEvents = summary?.draftEvents ?? [];
  const { goingEvents } = goingSummary;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={Platform.OS === 'ios' ? styles.headerIOS : styles.header}>
          <View
            testID="event-dash-back-control"
            style={Platform.OS === 'ios' ? styles.backButtonAbsolute : undefined}
          >
            <GoBackIcon
              color={palette.textPrimary}
              size={32}
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
          {Platform.OS === 'ios' ? (
            <Text style={[styles.headerTitle, styles.headerTitleCentered]}>
              <Text style={styles.headerTitleAccent}>Go!</Text>
              {' Dashboard'}
            </Text>
          ) : (
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                <Text style={styles.headerTitleAccent}>Go!</Text>
                {' Dashboard'}
              </Text>
            </View>
          )}
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
          {isCreator ? (
            <>
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
                <Pressable
                  style={[styles.actionCard, styles.actionCardPrimary]}
                  onPress={async () => {
                    const draft = await createConnectPortalDraft();
                    navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
                  }}
                >
                  <Text style={styles.actionPrimaryTitle}>New Event</Text>
                  <Text style={styles.actionPrimaryBody}>Start the seven-step event flow.</Text>
                </Pressable>

                <Pressable
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('ConnectGoMyEvents')}
                >
                  <Text style={styles.actionSecondaryTitle}>My Events</Text>
                  <Text style={styles.actionSecondaryBody}>
                    Drafts, active events, and event history.
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.actionCard}
                  onPress={() =>
                    navigation.navigate('ConnectGoMyEvents', { initialFilter: 'Draft' })
                  }
                >
                  <Text style={styles.actionSecondaryTitle}>Drafts</Text>
                  <Text style={styles.actionSecondaryBody}>
                    {draftEvents.length} saved draft{draftEvents.length === 1 ? '' : 's'}
                  </Text>
                </Pressable>

                <Pressable
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
                </Pressable>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Events</Text>
                <Pressable onPress={() => navigation.navigate('ConnectGoMyEvents')}>
                  <Text style={styles.sectionLink}>View all</Text>
                </Pressable>
              </View>

              {activeEvents.slice(0, 3).map((eventRecord) => {
                const progressPercent = Math.round(getEventProgressRatio(eventRecord) * 100);
                return (
                  <View key={eventRecord.id} style={styles.eventCard}>
                    <Text style={styles.eventCategory}>{eventRecord.category}</Text>
                    <Text style={styles.eventTitle}>{eventRecord.title}</Text>
                    <Text style={styles.eventMeta}>{formatConnectPortalDateTime(eventRecord)}</Text>
                    <Text style={styles.eventMeta}>
                      {eventRecord.venueName || eventRecord.address}
                    </Text>

                    <View style={styles.progressBlock}>
                      <View style={styles.progressHeaderRow}>
                        <Text style={styles.progressText}>
                          {getEventCapacityLabel(eventRecord)}
                        </Text>
                        <Text style={styles.progressText}>{progressPercent}%</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                      </View>
                    </View>

                    <View style={styles.eventActions}>
                      <Pressable
                        style={styles.eventActionPrimary}
                        onPress={() =>
                          navigation.navigate('ConnectGoEventView', { eventId: eventRecord.id })
                        }
                      >
                        <Text style={styles.eventActionPrimaryText}>Manage Event</Text>
                      </Pressable>
                      <Pressable
                        style={styles.eventActionSecondary}
                        onPress={() =>
                          navigation.navigate('ConnectGoEventAnalytics', {
                            eventId: eventRecord.id,
                          })
                        }
                      >
                        <Text style={styles.eventActionSecondaryText}>Analytics</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>GOING</Text>
                  <Text style={styles.statValue}>
                    {formatConnectPortalNumber(goingEvents.length)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>UPCOMING</Text>
                  <Text style={styles.statValue}>
                    {formatConnectPortalNumber(goingSummary.upcomingEvents.length)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>ONLINE</Text>
                  <Text style={styles.statValue}>
                    {formatConnectPortalNumber(goingSummary.onlineEvents.length)}
                  </Text>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Going</Text>
                <Pressable onPress={() => refresh(true)}>
                  <Text style={styles.sectionLink}>Refresh</Text>
                </Pressable>
              </View>

              {goingEvents.length < 1 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No events yet</Text>
                  <Text style={styles.emptyBody}>Tap Go! on an event to add it to this list.</Text>
                </View>
              ) : (
                goingEvents.map((eventRecord) => (
                  <View key={eventRecord.id} style={styles.eventCard}>
                    <Text style={styles.eventCategory}>{eventRecord.category}</Text>
                    <Text style={styles.eventTitle}>{eventRecord.title}</Text>
                    <Text style={styles.eventMeta}>{formatConnectPortalDateTime(eventRecord)}</Text>
                    <Text style={styles.eventMeta}>
                      {eventRecord.isOnline
                        ? 'Online Event'
                        : eventRecord.venueName || eventRecord.address || 'Location TBD'}
                    </Text>

                    <View style={styles.eventActions}>
                      <Pressable
                        style={styles.eventActionPrimary}
                        onPress={() =>
                          navigation.navigate('ConnectGoEventView', { eventId: eventRecord.id })
                        }
                      >
                        <Text style={styles.eventActionPrimaryText}>View Event</Text>
                      </Pressable>
                      <Pressable
                        style={styles.eventActionSecondary}
                        onPress={async () => {
                          await setConnectPortalEventGoing(eventRecord.id, false);
                          await refresh(true);
                        }}
                      >
                        <Text style={styles.eventActionSecondaryText}>Not Going</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default EventDashboardScreen;
