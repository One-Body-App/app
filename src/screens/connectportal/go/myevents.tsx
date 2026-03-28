import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  createConnectPortalDraft,
  deleteConnectPortalDraft,
  formatConnectPortalDateTime,
  getDraftResumeRouteName,
  getEventLifecycleState,
} from '@/src/services/connectPortal';
import type {
  ConnectPortalEventRecord,
  ConnectPortalMyEventsFilter,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { useConnectPalette } from '../shared';
import {
  APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
} from '@/src/styles/headerLayout';
import { borderRadius } from '@/src/styles/outlines';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoMyEvents'>;

const FILTERS: ConnectPortalMyEventsFilter[] = ['All', 'Active', 'Draft', 'Past'];
const GO_EVENT_ACCENT = '#126b87';
const GO_EVENT_BUTTON_RADIUS = borderRadius.button;

function MyEventsScreen({ navigation, route }: Props): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<ConnectPortalMyEventsFilter>(
    route.params?.initialFilter ?? 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { snapshot, refresh } = useConnectPortalData();
  const palette = useConnectPalette();

  const events = useMemo<ConnectPortalEventRecord[]>(() => {
    const allEvents = [...snapshot.organizerPublished, ...snapshot.drafts].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt)
    );
    if (activeFilter === 'All') {
      return allEvents;
    }
    return allEvents.filter((eventRecord) => getEventLifecycleState(eventRecord) === activeFilter);
  }, [activeFilter, snapshot.drafts, snapshot.organizerPublished]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.initialFilter) {
        setActiveFilter(route.params.initialFilter);
      }
    }, [route.params?.initialFilter])
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredEvents = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      return events;
    }

    return events.filter((eventRecord) => {
      const haystack = [eventRecord.title, eventRecord.venueName, eventRecord.address]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [events, searchQuery]);

  const primaryBtnTextColor = '#FFFFFF';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.screenBackground }]}>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: palette.screenBackground }]}>
          {Platform.OS === 'android' ? (
            <>
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                    return;
                  }
                  navigation.navigate('ConnectGoEventDash');
                }}
              >
                <MaterialIcons name="chevron-left" size={32} color={GO_EVENT_ACCENT} />
              </TouchableOpacity>
              <View style={styles.headerAndroidTitleWrap}>
                <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>My Events</Text>
                <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
                  Drafts, active events, and event history
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: GO_EVENT_ACCENT }]}
                onPress={async () => {
                  const draft = await createConnectPortalDraft();
                  navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
                }}
              >
                <Text style={[styles.addButtonText, { color: primaryBtnTextColor }]}>+</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                    return;
                  }
                  navigation.navigate('ConnectGoEventDash');
                }}
              >
                <MaterialIcons name="chevron-left" size={32} color={GO_EVENT_ACCENT} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>My Events</Text>
                <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
                  Drafts, active events, and event history
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: GO_EVENT_ACCENT }]}
                onPress={async () => {
                  const draft = await createConnectPortalDraft();
                  navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
                }}
              >
                <Text style={[styles.addButtonText, { color: primaryBtnTextColor }]}>+</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.searchWrap}>
          {route.params?.resumeError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{route.params.resumeError}</Text>
            </View>
          ) : null}
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.border,
                color: palette.textPrimary,
              },
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your events..."
            placeholderTextColor={palette.inputPlaceholder}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filterName) => {
            const isActive = activeFilter === filterName;
            return (
              <TouchableOpacity
                key={filterName}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? GO_EVENT_ACCENT : palette.inputBg,
                    borderColor: isActive ? GO_EVENT_ACCENT : palette.border,
                  },
                ]}
                onPress={() => setActiveFilter(filterName)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? primaryBtnTextColor : palette.textPrimary },
                  ]}
                >
                  {filterName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
          {filteredEvents.map((eventRecord) => {
            const lifecycle = getEventLifecycleState(eventRecord);
            const isDraft = eventRecord.status === 'draft';
            const draftBadgeBg = palette.isDark ? 'rgba(245,238,230,0.12)' : '#F5EEE6';
            const activeBadgeBg = palette.isDark ? 'rgba(234,245,247,0.12)' : '#EAF5F7';
            const badgeBg = isDraft ? draftBadgeBg : activeBadgeBg;
            return (
              <View
                key={eventRecord.id}
                style={[
                  styles.card,
                  { backgroundColor: palette.inputBg, borderColor: palette.border },
                ]}
              >
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: GO_EVENT_ACCENT }]}>
                      {lifecycle.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
                  {eventRecord.title || 'Untitled Event'}
                </Text>
                <Text style={[styles.cardMeta, { color: palette.textSecondary }]}>
                  {formatConnectPortalDateTime(eventRecord)}
                </Text>
                <Text style={[styles.cardMeta, { color: palette.textSecondary }]}>
                  {eventRecord.isOnline
                    ? 'Online Event'
                    : eventRecord.venueName || eventRecord.address}
                </Text>

                <View style={styles.actionRow}>
                  {isDraft ? (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.primaryButton,
                          { backgroundColor: GO_EVENT_ACCENT },
                        ]}
                        onPress={() =>
                          navigation.navigate(getDraftResumeRouteName(eventRecord), {
                            draftId: eventRecord.id,
                          })
                        }
                      >
                        <Text style={[styles.primaryButtonText, { color: primaryBtnTextColor }]}>
                          Resume Draft
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.secondaryButton,
                          { backgroundColor: palette.inputBg, borderColor: palette.border },
                        ]}
                        onPress={async () => {
                          await deleteConnectPortalDraft(eventRecord.id);
                          await refresh(true);
                        }}
                      >
                        <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.primaryButton,
                          { backgroundColor: GO_EVENT_ACCENT },
                        ]}
                        onPress={() =>
                          navigation.navigate('ConnectGoEventView', { eventId: eventRecord.id })
                        }
                      >
                        <Text style={[styles.primaryButtonText, { color: primaryBtnTextColor }]}>
                          Manage
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.secondaryButton,
                          { backgroundColor: palette.inputBg, borderColor: palette.border },
                        ]}
                        onPress={() =>
                          navigation.navigate('ConnectGoEventAnalytics', {
                            eventId: eventRecord.id,
                          })
                        }
                      >
                        <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
                          Analytics
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
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
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: APP_HEADER_ROW_HEIGHT,
    marginTop: APP_HEADER_ROW_OFFSET,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerBackButton: {
    width: APP_HEADER_SIDE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAndroidTitleWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
    gap: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
  },
  addButton: {
    width: APP_HEADER_SIDE_WIDTH,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 26,
    fontWeight: '400',
    marginTop: Platform.OS === 'android' ? 0 : -2,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  errorBanner: {
    borderRadius: 12,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#F5B6B2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: '#8E3025',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  searchInput: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  filterChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  cardMeta: {
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: GO_EVENT_BUTTON_RADIUS,
  },
  primaryButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default MyEventsScreen;
