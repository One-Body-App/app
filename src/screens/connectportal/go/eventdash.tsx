import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
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
import { useConnectPalette } from '../shared';
import { borderRadius } from '@/src/styles/outlines';
import {
  CONNECT_HEADER_ANDROID_TITLE_PADDING_LEFT,
  CONNECT_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  CONNECT_HEADER_SIDE_WIDTH,
} from '@/src/styles/headerLayout';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoEventDash'>;

const GO_EVENT_ACCENT = '#126b87';
const GO_EVENT_PRIMARY_CARD_BG = '#002f3e';
const GO_EVENT_PRIMARY_CARD_BODY = '#519bb9';
const GO_EVENT_SECONDARY_ICON_BG = '#d6e5ec';
const GO_EVENT_SECONDARY_ICON_COLOR = '#004d63';
const GO_EVENT_DISABLED_ICON_BG = '#dadadb';
const GO_EVENT_DISABLED_TEXT = '#71787b';
const GO_EVENT_EMPTY_BADGE_BG = '#bce9ff';
const GO_EVENT_EMPTY_CIRCLE_BG = 'rgba(214,229,236,0.18)';
const GO_EVENT_BUTTON_RADIUS = borderRadius.button;

function EventDashboardScreen({ navigation }: Props): React.JSX.Element {
  const [refreshing, setRefreshing] = useState(false);
  const { snapshot, refresh } = useConnectPortalData();
  const palette = useConnectPalette();

  const summary = useMemo(
    () => ({
      activeEvents: snapshot.organizerPublished.filter(
        (item) => getEventLifecycleState(item) === 'Active'
      ),
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
    [snapshot.organizerPublished]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const { activeEvents } = summary;
  const hasPublishedEvents = snapshot.organizerPublished.length > 0;
  const secondaryActionBorderColor = palette.isDark ? palette.borderStrong : palette.border;
  const progressTrackColor = palette.isDark ? 'rgba(230,234,236,0.12)' : '#E4EDF0';
  const statsDividerColor = palette.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(193,199,203,0.35)';
  const statsCardBg = palette.isDark ? 'rgba(255,255,255,0.06)' : '#f4f3f4';
  const analyticsBg = palette.isDark ? 'rgba(255,255,255,0.04)' : '#f4f3f4';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.screenBackground }]}>
      <View style={[styles.header, { backgroundColor: palette.screenBackground }]}>
        {Platform.OS === 'android' ? (
          <>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
            >
              <MaterialIcons name="chevron-left" size={32} color={GO_EVENT_ACCENT} />
            </TouchableOpacity>
            <View style={styles.headerAndroidTitleWrap}>
              <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
                Event Management
              </Text>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
            >
              <MaterialIcons name="chevron-left" size={32} color={GO_EVENT_ACCENT} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
                Event Management
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </>
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
        {/* Unified Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: statsCardBg }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>REGISTRATIONS</Text>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
              {formatConnectPortalNumber(summary.totalRegistrations)}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: statsDividerColor }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>VIEWS</Text>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
              {formatConnectPortalNumber(summary.totalViews)}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: statsDividerColor }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>OPENS</Text>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
              {formatConnectPortalNumber(summary.totalOpens)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {/* New Event */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: GO_EVENT_PRIMARY_CARD_BG }]}
            activeOpacity={0.88}
            onPress={async () => {
              const draft = await createConnectPortalDraft();
              navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
            }}
          >
            <View style={styles.actionRow}>
              <View style={styles.actionIconPrimary}>
                <MaterialIcons name="event" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: '#FFFFFF' }]}>New Event</Text>
                <Text style={[styles.actionBody, { color: GO_EVENT_PRIMARY_CARD_BODY }]}>
                  Bring the community together.
                </Text>
              </View>
            </View>
            <View style={styles.actionDecoration} pointerEvents="none">
              <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Defs>
                  <LinearGradient id="newEventGrad" x1="1" y1="0" x2="0" y2="0">
                    <Stop offset="0%" stopColor="#519bb9" stopOpacity="0.22" />
                    <Stop offset="100%" stopColor="#519bb9" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#newEventGrad)" />
                <Path d="M0,0 L100,0 L100,100 Z" fill="rgba(81,155,185,0.25)" />
                <Circle cx="80" cy="20" r="15" fill="rgba(81,155,185,0.18)" />
                <Rect x="60" y="60" width="30" height="30" rx="4" fill="rgba(81,155,185,0.14)" />
              </Svg>
            </View>
          </TouchableOpacity>

          {/* My Events */}
          <TouchableOpacity
            style={[
              styles.actionCard,
              styles.actionCardShadow,
              { backgroundColor: palette.inputBg, borderColor: palette.border, borderWidth: 1 },
            ]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('ConnectGoMyEvents')}
          >
            <View style={styles.actionRow}>
              <View
                style={[
                  styles.actionIconSecondary,
                  { backgroundColor: GO_EVENT_SECONDARY_ICON_BG },
                ]}
              >
                <MaterialIcons name="event-note" size={26} color={GO_EVENT_SECONDARY_ICON_COLOR} />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: palette.textPrimary }]}>My Events</Text>
                <Text style={[styles.actionBody, { color: palette.textSecondary }]}>
                  Manage your upcoming events, drafts, and past gatherings.
                </Text>
              </View>
            </View>
            <View style={styles.actionDecoration} pointerEvents="none">
              <View style={[styles.gridDecoration, { opacity: palette.isDark ? 0.08 : 0.05 }]}>
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((k) => (
                  <View
                    key={k}
                    style={[styles.gridCell, { backgroundColor: palette.textPrimary }]}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>

          {/* Analytics */}
          <TouchableOpacity
            style={[
              styles.actionCard,
              styles.actionCardShadow,
              styles.actionCardDisabled,
              { backgroundColor: analyticsBg, borderColor: palette.border, borderWidth: 1 },
            ]}
            activeOpacity={hasPublishedEvents ? 0.88 : 1}
            onPress={() => {
              if (hasPublishedEvents) {
                navigation.navigate('ConnectGoEventAnalytics');
              }
            }}
          >
            <View style={styles.actionRow}>
              <View
                style={[styles.actionIconSecondary, { backgroundColor: GO_EVENT_DISABLED_ICON_BG }]}
              >
                <MaterialIcons name="bar-chart" size={26} color={GO_EVENT_DISABLED_TEXT} />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: GO_EVENT_DISABLED_TEXT }]}>
                  Analytics
                </Text>
                <Text style={[styles.actionBody, { color: palette.textSecondary }]}>
                  {hasPublishedEvents
                    ? 'Open your analytics dashboard.'
                    : 'Unlock insights once your event is live.'}
                </Text>
              </View>
            </View>
            <View style={styles.actionDecoration} pointerEvents="none">
              <Svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
                <Path
                  d="M10,50 L30,50 L40,30 L60,30 L70,70 L90,70"
                  stroke="rgba(113,120,123,0.3)"
                  strokeWidth="0.8"
                />
                <Circle cx="10" cy="50" r="2" fill="rgba(113,120,123,0.3)" />
                <Circle cx="90" cy="70" r="2" fill="rgba(113,120,123,0.3)" />
              </Svg>
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Events */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Active Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ConnectGoMyEvents')}>
            <Text style={[styles.sectionLink, { color: GO_EVENT_ACCENT }]}>View all</Text>
          </TouchableOpacity>
        </View>

        {activeEvents.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: palette.inputBg, borderColor: palette.border, borderWidth: 1 },
            ]}
          >
            <View style={styles.emptyIllustration}>
              <View style={[styles.emptyCircle, { backgroundColor: GO_EVENT_EMPTY_CIRCLE_BG }]} />
              <View style={styles.emptyInner}>
                <MaterialIcons name="calendar-today" size={52} color="rgba(186,201,208,0.55)" />
              </View>
              <View style={[styles.emptyBadge, { backgroundColor: GO_EVENT_EMPTY_BADGE_BG }]}>
                <MaterialIcons name="wb-sunny" size={18} color="#001f29" />
              </View>
            </View>
            <Text style={[styles.emptyTitle, { color: palette.textSecondary }]}>
              No active events right now.
            </Text>
            <Text style={[styles.emptySubtitle, { color: GO_EVENT_DISABLED_TEXT }]}>
              Start by creating a new event to see it listed here.
            </Text>
          </View>
        ) : (
          activeEvents.slice(0, 3).map((eventRecord) => {
            const progressPercent = Math.round(getEventProgressRatio(eventRecord) * 100);
            return (
              <View
                key={eventRecord.id}
                style={[
                  styles.eventCard,
                  { backgroundColor: palette.inputBg, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.eventCategory, { color: GO_EVENT_ACCENT }]}>
                  {eventRecord.category}
                </Text>
                <Text style={[styles.eventTitle, { color: palette.textPrimary }]}>
                  {eventRecord.title}
                </Text>
                <Text style={[styles.eventMeta, { color: palette.textSecondary }]}>
                  {formatConnectPortalDateTime(eventRecord)}
                </Text>
                <Text style={[styles.eventMeta, { color: palette.textSecondary }]}>
                  {eventRecord.venueName || eventRecord.address}
                </Text>

                <View style={styles.progressBlock}>
                  <View style={styles.progressHeaderRow}>
                    <Text style={[styles.progressText, { color: palette.textSecondary }]}>
                      {getEventCapacityLabel(eventRecord)}
                    </Text>
                    <Text style={[styles.progressText, { color: palette.textSecondary }]}>
                      {progressPercent}%
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: progressTrackColor }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPercent}%`, backgroundColor: GO_EVENT_ACCENT },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={[styles.eventActionPrimary, { backgroundColor: GO_EVENT_ACCENT }]}
                    onPress={() =>
                      navigation.navigate('ConnectGoEventView', { eventId: eventRecord.id })
                    }
                  >
                    <Text style={styles.eventActionPrimaryText}>Manage Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.eventActionSecondary,
                      {
                        borderColor: secondaryActionBorderColor,
                        backgroundColor: palette.inputBg,
                      },
                    ]}
                    onPress={() =>
                      navigation.navigate('ConnectGoEventAnalytics', { eventId: eventRecord.id })
                    }
                  >
                    <Text style={[styles.eventActionSecondaryText, { color: palette.textPrimary }]}>
                      Analytics
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: CONNECT_HEADER_ROW_HEIGHT,
    marginTop: APP_HEADER_ROW_OFFSET,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerBackButton: {
    width: CONNECT_HEADER_SIDE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAndroidTitleWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: CONNECT_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Rubik-Bold',
  },
  headerSpacer: {
    width: CONNECT_HEADER_SIDE_WIDTH,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  // Unified stats card
  statsCard: {
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#032f3c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Rubik-Bold',
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  // Action cards
  quickActions: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 18,
    padding: 22,
    overflow: 'hidden',
  },
  actionCardDisabled: {
    opacity: 0.58,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconPrimary: {
    width: 54,
    height: 54,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionIconSecondary: {
    width: 54,
    height: 54,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: {
    flex: 1,
    gap: 3,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Rubik-Bold',
  },
  actionBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionCardShadow: {
    shadowColor: '#032f3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  actionDecoration: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
  },
  gridDecoration: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    padding: 14,
    alignContent: 'center',
  },
  gridCell: {
    width: 22,
    height: 14,
    borderRadius: 2,
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Rubik-Bold',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Empty state
  emptyCard: {
    borderRadius: 18,
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#032f3c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIllustration: {
    width: 136,
    height: 136,
    marginBottom: 24,
  },
  emptyCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 68,
  },
  emptyInner: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(193,199,203,0.25)',
    shadowColor: '#032f3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 210,
    lineHeight: 18,
  },
  // Active event cards
  eventCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 18,
    gap: 8,
  },
  eventCategory: {
    fontSize: 12,
    fontWeight: '800',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  eventMeta: {
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
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
    borderRadius: GO_EVENT_BUTTON_RADIUS,
  },
  eventActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  eventActionSecondary: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: GO_EVENT_BUTTON_RADIUS,
    borderWidth: 1,
  },
  eventActionSecondaryText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default EventDashboardScreen;
