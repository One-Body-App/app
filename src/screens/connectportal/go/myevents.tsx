import React, { useCallback, useMemo, useState } from 'react';
import {
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

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoMyEvents'>;

const FILTERS: ConnectPortalMyEventsFilter[] = ['All', 'Active', 'Draft', 'Past'];

function MyEventsScreen({ navigation, route }: Props): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<ConnectPortalMyEventsFilter>(
    route.params?.initialFilter ?? 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { snapshot, refresh } = useConnectPortalData();

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }
                navigation.navigate('ConnectGoEventDash');
              }}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Events</Text>
            <Text style={styles.headerSubtitle}>Drafts, active events, and event history</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={async () => {
              const draft = await createConnectPortalDraft();
              navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          {route.params?.resumeError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{route.params.resumeError}</Text>
            </View>
          ) : null}
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your events..."
            placeholderTextColor="#8AA0A8"
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
                style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
                onPress={() => setActiveFilter(filterName)}
              >
                <Text
                  style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}
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
            return (
              <View key={eventRecord.id} style={styles.card}>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, isDraft ? styles.badgeDraft : styles.badgeActive]}>
                    <Text style={styles.badgeText}>{lifecycle.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{eventRecord.title || 'Untitled Event'}</Text>
                <Text style={styles.cardMeta}>{formatConnectPortalDateTime(eventRecord)}</Text>
                <Text style={styles.cardMeta}>
                  {eventRecord.isOnline
                    ? 'Online Event'
                    : eventRecord.venueName || eventRecord.address}
                </Text>

                <View style={styles.actionRow}>
                  {isDraft ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={() =>
                          navigation.navigate(getDraftResumeRouteName(eventRecord), {
                            draftId: eventRecord.id,
                          })
                        }
                      >
                        <Text style={styles.primaryButtonText}>Resume Draft</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={async () => {
                          await deleteConnectPortalDraft(eventRecord.id);
                          await refresh(true);
                        }}
                      >
                        <Text style={styles.secondaryButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={() =>
                          navigation.navigate('ConnectGoEventView', { eventId: eventRecord.id })
                        }
                      >
                        <Text style={styles.primaryButtonText}>Manage</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() =>
                          navigation.navigate('ConnectGoEventAnalytics', {
                            eventId: eventRecord.id,
                          })
                        }
                      >
                        <Text style={styles.secondaryButtonText}>Analytics</Text>
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
    gap: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  backButtonText: {
    color: '#126b87',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#032f3c',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4F6D77',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#126b87',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '400',
    marginTop: -2,
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
    borderColor: '#D7E1E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#032f3c',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  filterChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
  },
  filterChipActive: {
    backgroundColor: '#126b87',
    borderColor: '#126b87',
  },
  filterChipText: {
    color: '#032f3c',
    fontSize: 14,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
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
  badgeActive: {
    backgroundColor: '#EAF5F7',
  },
  badgeDraft: {
    backgroundColor: '#F5EEE6',
  },
  badgeText: {
    color: '#126b87',
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#032f3c',
  },
  cardMeta: {
    fontSize: 14,
    color: '#4F6D77',
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
    borderRadius: 14,
  },
  primaryButton: {
    backgroundColor: '#126b87',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#032f3c',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default MyEventsScreen;
