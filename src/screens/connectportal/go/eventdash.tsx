import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { useConnectPalette } from '../shared';
import { borderRadius } from '@/src/styles/outlines';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoEventDash'>;
const GO_EVENT_ACCENT = '#126b87';
const GO_EVENT_BUTTON_RADIUS = borderRadius.button;

function EventDashboardScreen({ navigation }: Props): React.JSX.Element {
  const [refreshing, setRefreshing] = useState(false);
  const { snapshot, refresh } = useConnectPortalData();
  const palette = useConnectPalette();

  const summary = useMemo(
    () => ({
      featuredEvent:
        snapshot.organizerPublished.find((item) => getEventLifecycleState(item) === 'Active') ||
        snapshot.organizerPublished[0] ||
        null,
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

  const activeEvents = summary?.activeEvents ?? [];
  const hasPublishedEvents = snapshot.organizerPublished.length > 0;
  const primaryCardTextColor = '#FFFFFF';
  const primaryCardBodyColor = 'rgba(255,255,255,0.86)';
  const secondaryActionBorderColor = palette.isDark ? palette.borderStrong : palette.border;
  const progressTrackColor = palette.isDark ? 'rgba(230,234,236,0.12)' : '#E4EDF0';

  return (
    <View style={[styles.container, { backgroundColor: palette.screenBackground }]}>
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
          <View
            style={[
              styles.statCard,
              { backgroundColor: palette.inputBg, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Registrations</Text>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
              {formatConnectPortalNumber(summary?.totalRegistrations ?? 0)}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: palette.inputBg, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Views</Text>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
              {formatConnectPortalNumber(summary?.totalViews ?? 0)}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: palette.inputBg, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Opens</Text>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
              {formatConnectPortalNumber(summary?.totalOpens ?? 0)}
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.actionCard,
              styles.actionCardPrimary,
              { backgroundColor: GO_EVENT_ACCENT, borderColor: GO_EVENT_ACCENT },
            ]}
            onPress={async () => {
              const draft = await createConnectPortalDraft();
              navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
            }}
          >
            <Text style={[styles.actionPrimaryTitle, { color: primaryCardTextColor }]}>
              New Event
            </Text>
            <Text style={[styles.actionPrimaryBody, { color: primaryCardBodyColor }]}>
              Start the seven-step event flow.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: palette.inputBg, borderColor: palette.border },
            ]}
            onPress={() => navigation.navigate('ConnectGoMyEvents')}
          >
            <Text style={[styles.actionSecondaryTitle, { color: palette.textPrimary }]}>
              My Events
            </Text>
            <Text style={[styles.actionSecondaryBody, { color: palette.textSecondary }]}>
              Open active events, past events, and drafts.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: palette.inputBg, borderColor: palette.border },
              !hasPublishedEvents ? styles.actionCardDisabled : null,
            ]}
            onPress={() => navigation.navigate('ConnectGoEventAnalytics')}
          >
            <Text style={[styles.actionSecondaryTitle, { color: palette.textPrimary }]}>
              Analytics
            </Text>
            <Text style={[styles.actionSecondaryBody, { color: palette.textSecondary }]}>
              {hasPublishedEvents ? 'Open your analytics dashboard.' : 'No published events yet.'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Active Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ConnectGoMyEvents')}>
            <Text style={[styles.sectionLink, { color: GO_EVENT_ACCENT }]}>View all</Text>
          </TouchableOpacity>
        </View>

        {activeEvents.slice(0, 3).map((eventRecord) => {
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
                  <Text style={[styles.eventActionPrimaryText, { color: primaryCardTextColor }]}>
                    Manage Event
                  </Text>
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
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    fontWeight: '800',
    color: '#4F6D77',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#032f3c',
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
  actionCardDisabled: {
    opacity: 0.55,
  },
  actionPrimaryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  actionPrimaryBody: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 20,
  },
  actionSecondaryTitle: {
    color: '#032f3c',
    fontSize: 18,
    fontWeight: '800',
  },
  actionSecondaryBody: {
    color: '#4F6D77',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#032f3c',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionLink: {
    color: '#126b87',
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '800',
  },
  eventTitle: {
    color: '#032f3c',
    fontSize: 22,
    fontWeight: '800',
  },
  eventMeta: {
    color: '#4F6D77',
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
    color: '#4F6D77',
    fontSize: 13,
    fontWeight: '700',
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
    borderRadius: GO_EVENT_BUTTON_RADIUS,
    backgroundColor: '#126b87',
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
    borderColor: '#D7E1E5',
    backgroundColor: '#FFFFFF',
  },
  eventActionSecondaryText: {
    color: '#032f3c',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default EventDashboardScreen;
