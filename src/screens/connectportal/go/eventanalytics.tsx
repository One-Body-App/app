import React, { useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  formatConnectPortalDateTime,
  formatConnectPortalNumber,
  formatConnectPortalPercent,
  getConnectPortalEventAnalytics,
  getEventCapacityLabel,
  getEventProgressRatio,
  trackConnectPortalEventTelemetry,
} from '@/src/services/connectPortal';
import type { ConnectPortalPublishedEvent } from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectGoEventAnalytics'>;

const SUPPORT_MESSAGES = [
  {
    id: '1',
    name: 'Felix Carter',
    time: '10 min ago',
    text: 'Is there dedicated parking available at the venue? I will be driving from out of town.',
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    time: '2 hours ago',
    text: 'Will there be vegan options provided during the mixer?',
  },
  {
    id: '3',
    name: 'Marcus Chen',
    time: '5 hours ago',
    text: 'Can I bring a +1 even if they have not registered yet?',
  },
];

function EventAnalyticsScreen({ navigation, route }: Props): React.JSX.Element {
  const { snapshot, refresh } = useConnectPortalData();
  const [eventRecord, setEventRecord] = useState<ConnectPortalPublishedEvent | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    viewCount: number;
    openCount: number;
    registrationCount: number;
    conversionRate: number;
  } | null>(null);
  const eventId = route.params?.eventId;

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      if (!eventId) {
        return;
      }

      const payload = await getConnectPortalEventAnalytics(eventId);
      if (isActive) {
        setEventRecord((payload?.event as ConnectPortalPublishedEvent) || null);
        setAnalyticsSummary(payload?.summary || null);
      }
      trackConnectPortalEventTelemetry(eventId, 'manage_view', {
        source: 'connect_event_analytics',
      }).catch(() => {});
    })();

    return () => {
      isActive = false;
    };
  });

  useFocusEffect(
    React.useCallback(() => {
      if (!eventId) {
        refresh();
      }
    }, [eventId, refresh])
  );

  const { organizerPublished } = snapshot;

  const dashboardSummary = useMemo(() => {
    const registrationCount = organizerPublished.reduce(
      (sum, item) => sum + Number(item.registrationCount || 0),
      0
    );
    const viewCount = organizerPublished.reduce(
      (sum, item) => sum + Number(item.viewCount || 0),
      0
    );
    const openCount = organizerPublished.reduce(
      (sum, item) => sum + Number(item.openCount || 0),
      0
    );
    const conversionRate = openCount > 0 ? registrationCount / openCount : 0;
    return {
      registrationCount,
      viewCount,
      openCount,
      conversionRate,
    };
  }, [organizerPublished]);

  const resolvedSummary = eventId ? analyticsSummary : dashboardSummary;

  const progressPercent = useMemo(() => {
    if (eventRecord) {
      return Math.round(getEventProgressRatio(eventRecord) * 100);
    }

    const totalCapacity = organizerPublished.reduce((sum, item) => {
      const parsed = Number(item.capacity || 0);
      return Number.isFinite(parsed) && parsed > 0 ? sum + parsed : sum;
    }, 0);
    if (totalCapacity <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((dashboardSummary.registrationCount / totalCapacity) * 100));
  }, [dashboardSummary.registrationCount, eventRecord, organizerPublished]);

  const headerTitle = eventRecord?.title || (eventId ? 'Event Analytics' : 'Analytics Dashboard');
  let headerSubtitle = 'No published events yet';
  if (eventRecord) {
    headerSubtitle = formatConnectPortalDateTime(eventRecord);
  } else if (organizerPublished.length > 0) {
    headerSubtitle = `${organizerPublished.length} published event${
      organizerPublished.length === 1 ? '' : 's'
    }`;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>REGISTRATIONS</Text>
              <Text style={styles.metricValue}>
                {formatConnectPortalNumber(resolvedSummary?.registrationCount ?? 0)}
              </Text>
              <Text style={styles.metricSubvalue}>
                {eventRecord
                  ? getEventCapacityLabel(eventRecord)
                  : `${organizerPublished.length} event${
                      organizerPublished.length === 1 ? '' : 's'
                    } tracked`}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>DETAIL VIEWS</Text>
              <Text style={styles.metricValue}>
                {formatConnectPortalNumber(
                  resolvedSummary?.viewCount ?? eventRecord?.viewCount ?? 0
                )}
              </Text>
              <Text style={styles.metricSubvalue}>Persisted event-detail views</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>CONVERSION</Text>
              <Text style={styles.metricValue}>
                {formatConnectPortalPercent(resolvedSummary?.conversionRate ?? 0)}
              </Text>
              <Text style={styles.metricSubvalue}>
                {formatConnectPortalNumber(
                  resolvedSummary?.openCount ?? eventRecord?.openCount ?? 0
                )}{' '}
                opens
              </Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Registration Progress</Text>
            <Text style={styles.chartSubtitle}>{progressPercent}% of capacity reached</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.svgWrap}>
              <Svg width="100%" height="100%" viewBox="0 0 478 150" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="150">
                    <Stop offset="0%" stopColor="#ec5b13" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#ec5b13" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Path
                  d="M0 109C18.15 109 18.15 21 36.31 21C54.46 21 54.46 41 72.62 41C90.77 41 90.77 93 108.92 93C127.08 93 127.08 33 145.23 33C163.39 33 163.39 101 181.54 101C199.69 101 199.69 61 217.85 61C236 61 236 45 254.15 45C272.31 45 272.31 121 290.46 121C308.62 121 308.62 149 326.77 149C344.92 149 344.92 1 363.08 1C381.23 1 381.23 81 399.39 81C417.54 81 417.54 129 435.69 129C453.85 129 453.85 25 472 25V150H0V109Z"
                  fill="url(#chart-grad)"
                />
                <Path
                  d="M0 109C18.15 109 18.15 21 36.31 21C54.46 21 54.46 41 72.62 41C90.77 41 90.77 93 108.92 93C127.08 93 127.08 33 145.23 33C163.39 33 163.39 101 181.54 101C199.69 101 199.69 61 217.85 61C236 61 236 45 254.15 45C272.31 45 272.31 121 290.46 121C308.62 121 308.62 149 326.77 149C344.92 149 344.92 1 363.08 1C381.23 1 381.23 81 399.39 81C417.54 81 417.54 129 435.69 129C453.85 129 453.85 25 472 25"
                  stroke="#ec5b13"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </View>
          </View>

          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Attendee Support</Text>
            {SUPPORT_MESSAGES.map((message) => (
              <View key={message.id} style={styles.messageRow}>
                <View style={styles.messageAvatar}>
                  <Text style={styles.messageAvatarText}>
                    {message.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.messageBody}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageName}>{message.name}</Text>
                    <Text style={styles.messageTime}>{message.time}</Text>
                  </View>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              </View>
            ))}
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backText: {
    color: '#126b87',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#032f3c',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  headerSubtitle: {
    color: '#4F6D77',
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 18,
    gap: 6,
  },
  metricLabel: {
    color: '#4F6D77',
    fontSize: 12,
    fontWeight: '800',
  },
  metricValue: {
    color: '#032f3c',
    fontSize: 30,
    fontWeight: '800',
  },
  metricSubvalue: {
    color: '#4F6D77',
    fontSize: 14,
    lineHeight: 20,
  },
  chartCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 18,
    gap: 10,
  },
  chartTitle: {
    color: '#032f3c',
    fontSize: 22,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: '#4F6D77',
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E4EDF0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ec5b13',
  },
  svgWrap: {
    height: 180,
  },
  supportCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 18,
    gap: 16,
  },
  supportTitle: {
    color: '#032f3c',
    fontSize: 22,
    fontWeight: '800',
  },
  messageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  messageAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5F7',
  },
  messageAvatarText: {
    color: '#126b87',
    fontSize: 13,
    fontWeight: '800',
  },
  messageBody: {
    flex: 1,
    gap: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  messageName: {
    color: '#032f3c',
    fontSize: 15,
    fontWeight: '700',
  },
  messageTime: {
    color: '#4F6D77',
    fontSize: 12,
  },
  messageText: {
    color: '#4F6D77',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default EventAnalyticsScreen;
