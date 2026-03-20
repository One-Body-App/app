import React, { useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilterSortIcon from '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg';
import StyledText from '@/components/styled/Text';
import { ConnectStackParamsList } from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import {
  createConnectPortalDraft,
  formatConnectPortalDateTime,
  trackConnectPortalEventTelemetry,
  type ConnectQuickChip,
  type ConnectPortalEventRecord,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import type { ConnectTab } from '../data';
import {
  CONNECT_BRAND,
  CONNECT_BOTTOM_NAV_BASE_OFFSET,
  CONNECT_BOTTOM_SEARCH_ROW_HEIGHT,
  CONNECT_BOTTOM_STACK_GAP,
  CONNECT_GO_QUICK_CHIPS,
  ConnectPlacesQuickChips,
  ConnectPortalChrome,
  ConnectPortalFilterSheet,
  ConnectRetractableSearchBar,
  useConnectKeyboardMetrics,
  useConnectPalette,
} from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoLanding'>;

function EventItemSeparator() {
  return <View style={{ height: spacing.x13 }} />;
}

const normalize = (value: string) => value.trim().toLowerCase();

const matchesSearch = (query: string, values: Array<string | undefined>) => {
  if (!query) {
    return true;
  }

  return values.some((value) => normalize(String(value || '')).includes(query));
};

const isUpcomingEvent = (startDate: string) => {
  if (!startDate) {
    return true;
  }

  return startDate >= new Date().toISOString().slice(0, 10);
};

function GoLandingScreen({ navigation }: Props): React.JSX.Element {
  const palette = useConnectPalette();
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const {
    snapshot,
    refresh,
    setActiveTab,
    setViewMode,
    searchByTab,
    setSearchText,
    places,
    go,
    serve,
  } = useConnectPortalData();
  const [refreshing, setRefreshing] = useState(false);
  const { keyboardHeight, keyboardVisible } = useConnectKeyboardMetrics();

  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('Go!');
      setViewMode('Go!', 'list');
      refresh();
    }, [refresh, setActiveTab, setViewMode])
  );

  const eventRecords = useMemo(() => {
    const searchQuery = normalize(searchByTab['Go!']);
    const filtered = snapshot.publicPublished.filter((eventRecord) => {
      if (
        go.filters.eventType &&
        normalize(eventRecord.eventType) !== normalize(go.filters.eventType)
      ) {
        return false;
      }

      if (
        go.filters.category &&
        normalize(eventRecord.category) !== normalize(go.filters.category)
      ) {
        return false;
      }

      if (go.filters.mode === 'online' && !eventRecord.isOnline) {
        return false;
      }

      if (go.filters.mode === 'in_person' && eventRecord.isOnline) {
        return false;
      }

      if (go.quickChip === 'Upcoming' && !isUpcomingEvent(eventRecord.startDate)) {
        return false;
      }

      if (go.quickChip === 'Online' && !eventRecord.isOnline) {
        return false;
      }

      if (go.quickChip === 'In Person' && eventRecord.isOnline) {
        return false;
      }

      if (
        go.quickChip === 'Live' &&
        !eventRecord.isLive &&
        !eventRecord.tags.some((tag) => normalize(tag) === 'live')
      ) {
        return false;
      }

      return matchesSearch(searchQuery, [
        eventRecord.title,
        eventRecord.venueName,
        eventRecord.address,
        eventRecord.eventType,
        eventRecord.category,
        ...eventRecord.tags,
      ]);
    });

    return [...filtered].sort((left, right) => {
      if (go.filters.sort === 'alphabetical') {
        return left.title.localeCompare(right.title);
      }

      if (go.filters.sort === 'recently_updated') {
        return right.updatedAt.localeCompare(left.updatedAt);
      }

      const dateCompare = (left.startDate || '').localeCompare(right.startDate || '');
      if (dateCompare !== 0) {
        return dateCompare;
      }

      return (left.startTime || '').localeCompare(right.startTime || '');
    });
  }, [go.filters, go.quickChip, searchByTab, snapshot.publicPublished]);

  const featuredEvent = eventRecords[0] || null;
  const recommendedEvents = eventRecords.slice(featuredEvent ? 1 : 0);
  const liveEventCount = eventRecords.filter(
    (eventRecord) => eventRecord.isLive || eventRecord.tags.some((tag) => normalize(tag) === 'live')
  ).length;
  const onlineEventCount = eventRecords.filter((eventRecord) => eventRecord.isOnline).length;

  const handleEventPress = (
    eventId: string,
    source: 'connect_go_landing_featured' | 'connect_go_landing_list'
  ) => {
    trackConnectPortalEventTelemetry(eventId, 'detail_open', {
      source,
    }).catch(() => {});
    navigation.navigate('ConnectGoEventView', { eventId });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: ConnectTab) => {
    if (tab === 'Go!') {
      return;
    }

    setActiveTab(tab);

    if (tab === 'Places') {
      navigation.navigate('ConnectPortal', { initialTab: 'Places' });
      return;
    }

    navigation.navigate('ConnectServeHome');
  };

  const handleViewModeChange = (viewMode: 'list' | 'map') => {
    setViewMode('Go!', viewMode);
    if (viewMode === 'map') {
      navigation.navigate('ConnectMap', { initialTab: 'Go!' });
      return;
    }

    navigation.navigate('ConnectPortal', { initialTab: 'Go!' });
  };

  const bottomSearchClearance =
    insets.bottom +
    CONNECT_BOTTOM_NAV_BASE_OFFSET +
    CONNECT_BOTTOM_SEARCH_ROW_HEIGHT +
    CONNECT_BOTTOM_STACK_GAP;
  const searchRowBottom = keyboardVisible
    ? keyboardHeight + CONNECT_BOTTOM_STACK_GAP
    : insets.bottom + CONNECT_BOTTOM_NAV_BASE_OFFSET;

  return (
    <View style={[styles.container, { backgroundColor: palette.screenBackground }]}>
      <ConnectPortalChrome
        activeTab="Go!"
        onTabChange={handleTabChange}
        userAvatarUri={currentUser?.profileImage || NO_PROFILE_IMAGE}
        headerActionIconName="map"
        headerActionAccessibilityLabel="Switch to map view"
        onHeaderActionPress={() => handleViewModeChange('map')}
      />

      <FlatList<ConnectPortalEventRecord>
        style={styles.content}
        data={recommendedEvents}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentBody, { paddingBottom: bottomSearchClearance }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.heroIntro}>
              <StyledText style={[styles.heroEyebrow, { color: palette.activeText }]}>
                GO! PORTAL
              </StyledText>
              <StyledText style={[styles.heroTitle, { color: palette.textPrimary }]}>
                Event Discovery
              </StyledText>
              <StyledText style={[styles.heroBody, { color: palette.textSecondary }]}>
                Find featured experiences, browse live opportunities, and jump into map or list
                mode.
              </StyledText>
            </View>

            <View style={styles.organizerRow}>
              <TouchableOpacity
                style={[
                  styles.organizerButton,
                  { backgroundColor: palette.inputBg, borderColor: palette.border },
                ]}
                onPress={() => navigation.navigate('ConnectGoEventDash')}
              >
                <MaterialIcons name="dashboard" size={18} color={palette.activeText} />
                <StyledText style={[styles.organizerButtonText, { color: palette.textPrimary }]}>
                  Event Dashboard
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.organizerButton,
                  { backgroundColor: palette.inputBg, borderColor: palette.border },
                ]}
                onPress={() => navigation.navigate('ConnectGoMyEvents')}
              >
                <MaterialIcons name="event-note" size={18} color={palette.activeText} />
                <StyledText style={[styles.organizerButtonText, { color: palette.textPrimary }]}>
                  My Events
                </StyledText>
              </TouchableOpacity>
            </View>

            <ConnectPlacesQuickChips
              chips={CONNECT_GO_QUICK_CHIPS}
              selectedChip={go.quickChip as ConnectQuickChip}
              onSelect={(chip) => go.setQuickChip(chip as (typeof CONNECT_GO_QUICK_CHIPS)[number])}
            />

            <View style={styles.metricRow}>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: palette.inputBg, borderColor: palette.border },
                ]}
              >
                <MaterialIcons name="event-available" size={18} color={palette.activeText} />
                <View style={styles.metricCopy}>
                  <StyledText style={[styles.metricValue, { color: palette.textPrimary }]}>
                    {eventRecords.length}
                  </StyledText>
                  <StyledText style={[styles.metricLabel, { color: palette.textSecondary }]}>
                    Matching events
                  </StyledText>
                </View>
              </View>

              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: palette.inputBg, borderColor: palette.border },
                ]}
              >
                <MaterialIcons name="sensors" size={18} color={palette.activeText} />
                <View style={styles.metricCopy}>
                  <StyledText style={[styles.metricValue, { color: palette.textPrimary }]}>
                    {liveEventCount}
                  </StyledText>
                  <StyledText style={[styles.metricLabel, { color: palette.textSecondary }]}>
                    Live right now
                  </StyledText>
                </View>
              </View>

              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: palette.inputBg, borderColor: palette.border },
                ]}
              >
                <MaterialIcons name="public" size={18} color={palette.activeText} />
                <View style={styles.metricCopy}>
                  <StyledText style={[styles.metricValue, { color: palette.textPrimary }]}>
                    {onlineEventCount}
                  </StyledText>
                  <StyledText style={[styles.metricLabel, { color: palette.textSecondary }]}>
                    Online options
                  </StyledText>
                </View>
              </View>
            </View>

            {featuredEvent ? (
              <TouchableOpacity
                activeOpacity={0.94}
                style={styles.featuredWrap}
                onPress={() => handleEventPress(featuredEvent.id, 'connect_go_landing_featured')}
              >
                <Image
                  source={{
                    uri: featuredEvent.photoUri || featuredEvent.heroImageUri || NO_PROFILE_IMAGE,
                  }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={
                    dark
                      ? ['rgba(3,47,60,0.04)', 'rgba(3,47,60,0.56)', 'rgba(3,47,60,0.92)']
                      : ['rgba(3,47,60,0.02)', 'rgba(3,47,60,0.34)', 'rgba(3,47,60,0.86)']
                  }
                  style={styles.featuredGradient}
                />

                <View style={styles.featuredContent}>
                  <View style={styles.featuredPill}>
                    <StyledText style={styles.featuredPillText}>Featured Event</StyledText>
                  </View>

                  <View style={styles.featuredCopy}>
                    <StyledText style={styles.featuredTitle}>{featuredEvent.title}</StyledText>
                    <StyledText style={styles.featuredDescription} numberOfLines={3}>
                      {featuredEvent.description ||
                        'Explore the latest featured gathering on the Go! portal.'}
                    </StyledText>
                  </View>

                  <View style={styles.featuredMetaStack}>
                    <View style={styles.featuredMetaRow}>
                      <MaterialIcons
                        name="calendar-today"
                        size={16}
                        color={CONNECT_BRAND.infoBase}
                      />
                      <StyledText style={styles.featuredMetaText}>
                        {formatConnectPortalDateTime(featuredEvent)}
                      </StyledText>
                    </View>
                    <View style={styles.featuredMetaRow}>
                      <MaterialIcons name="place" size={16} color={CONNECT_BRAND.infoBase} />
                      <StyledText style={styles.featuredMetaText}>
                        {featuredEvent.venueName || featuredEvent.address || 'Location TBD'}
                      </StyledText>
                    </View>
                  </View>

                  <View style={styles.featuredFooter}>
                    <View style={styles.featuredTags}>
                      {(featuredEvent.tags.length > 0
                        ? featuredEvent.tags.slice(0, 2)
                        : [featuredEvent.category || featuredEvent.eventType || 'Event']
                      ).map((tag) => (
                        <View key={`${featuredEvent.id}-${tag}`} style={styles.featuredTag}>
                          <StyledText style={styles.featuredTagText}>{tag}</StyledText>
                        </View>
                      ))}
                    </View>

                    <View style={styles.featuredAction}>
                      <StyledText style={styles.featuredActionText}>Explore</StyledText>
                      <MaterialIcons name="arrow-forward" size={18} color="#032f3c" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: palette.inputBg, borderColor: palette.border },
                ]}
              >
                <MaterialIcons name="event-busy" size={34} color={palette.textSecondary} />
                <StyledText style={[styles.emptyStateTitle, { color: palette.textPrimary }]}>
                  No Go! events match right now
                </StyledText>
                <StyledText style={[styles.emptyStateBody, { color: palette.textSecondary }]}>
                  Adjust your search or filters to widen the discovery feed.
                </StyledText>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionCopy}>
                <StyledText style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                  Recommended for You
                </StyledText>
                <StyledText style={[styles.sectionBody, { color: palette.textSecondary }]}>
                  Upcoming experiences curated from the current Go! results.
                </StyledText>
              </View>

              <TouchableOpacity
                onPress={() => go.setFilterSheetOpen(true)}
                style={[
                  styles.filterIconButton,
                  {
                    backgroundColor: palette.mapActionBg,
                    borderColor: palette.mapActionBorder,
                  },
                ]}
              >
                <FilterSortIcon width={20} height={20} color={palette.activeText} />
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item: eventRecord }) => (
          <TouchableOpacity
            activeOpacity={0.92}
            style={[
              styles.eventCard,
              { backgroundColor: palette.inputBg, borderColor: palette.border },
            ]}
            onPress={() => handleEventPress(eventRecord.id, 'connect_go_landing_list')}
          >
            <Image
              source={{
                uri: eventRecord.photoUri || eventRecord.heroImageUri || NO_PROFILE_IMAGE,
              }}
              style={styles.eventImage}
              resizeMode="cover"
            />

            <View style={styles.eventCopy}>
              <StyledText
                style={[styles.eventTitle, { color: palette.textPrimary }]}
                numberOfLines={2}
              >
                {eventRecord.title}
              </StyledText>

              <View style={styles.eventMetaRow}>
                <MaterialIcons name="place" size={15} color={palette.textSecondary} />
                <StyledText
                  style={[styles.eventMeta, { color: palette.textSecondary }]}
                  numberOfLines={1}
                >
                  {eventRecord.venueName || eventRecord.address || 'Location TBD'}
                </StyledText>
              </View>

              <View style={styles.eventMetaRow}>
                <MaterialIcons name="calendar-today" size={15} color={palette.textSecondary} />
                <StyledText
                  style={[styles.eventMeta, { color: palette.textSecondary }]}
                  numberOfLines={1}
                >
                  {formatConnectPortalDateTime(eventRecord)}
                </StyledText>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.eventAction,
                { borderColor: palette.activeText, backgroundColor: 'transparent' },
              ]}
              onPress={() => handleEventPress(eventRecord.id, 'connect_go_landing_list')}
            >
              <StyledText style={[styles.eventActionText, { color: palette.activeText }]}>
                Details
              </StyledText>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={EventItemSeparator}
        ListEmptyComponent={
          featuredEvent ? (
            <View
              style={[
                styles.inlineEmptyState,
                { backgroundColor: palette.inputBg, borderColor: palette.border },
              ]}
            >
              <StyledText style={[styles.inlineEmptyStateTitle, { color: palette.textPrimary }]}>
                The featured event is the only current match.
              </StyledText>
              <StyledText style={[styles.inlineEmptyStateBody, { color: palette.textSecondary }]}>
                Clear a filter or change the search to see more options.
              </StyledText>
            </View>
          ) : null
        }
      />

      <View pointerEvents="box-none" style={[styles.bottomSearchDock, { bottom: searchRowBottom }]}>
        <ConnectRetractableSearchBar
          key="connect-go-list"
          searchText={searchByTab['Go!']}
          onSearchChange={(text) => setSearchText('Go!', text)}
          searchPlaceholder="Search events..."
          onAddPress={async () => {
            const draft = await createConnectPortalDraft();
            navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
          }}
        />
      </View>

      <ConnectPortalFilterSheet
        visible={go.filterSheetOpen}
        activeTab="Go!"
        onClose={() => go.setFilterSheetOpen(false)}
        places={{
          filters: places.filters,
          organizationTypes: places.organizationTypes,
          churchTypes: places.churchTypes,
          sortOptions: places.sortOptions,
          onApply: places.setFilters,
          onReset: places.resetFilters,
        }}
        go={{
          filters: go.filters,
          sortOptions: go.sortOptions,
          eventTypeOptions: go.eventTypeOptions,
          categoryOptions: go.categoryOptions,
          modeOptions: go.modeOptions,
          onApply: go.setFilters,
          onReset: go.resetFilters,
        }}
        serve={{
          filters: serve.filters,
          sortOptions: serve.sortOptions,
          roleTypeOptions: serve.roleTypeOptions,
          tagOptions: serve.tagOptions,
          onApply: serve.setFilters,
          onReset: serve.resetFilters,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentBody: {
    paddingHorizontal: spacing.x16,
    paddingTop: spacing.x16,
    paddingBottom: spacing.x48,
    gap: spacing.x20,
  },
  bottomSearchDock: {
    position: 'absolute',
    left: spacing.x16,
    right: spacing.x16,
    zIndex: 12,
  },
  heroIntro: {
    gap: spacing.x8,
  },
  heroEyebrow: {
    ...Typography.body.x1M,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...Typography.header.h2,
    fontWeight: '800',
  },
  heroBody: {
    ...Typography.body.x2,
    lineHeight: 38,
  },
  organizerRow: {
    flexDirection: 'row',
    gap: spacing.x10,
  },
  organizerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x13,
  },
  organizerButtonText: {
    ...Typography.body.x1M,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.x10,
  },
  metricCard: {
    flex: 1,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
  },
  metricCopy: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    ...Typography.body.x2M,
    fontWeight: '800',
  },
  metricLabel: {
    ...Typography.body.x5,
  },
  featuredWrap: {
    minHeight: 430,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: CONNECT_BRAND.surfaceStrong,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.x20,
    gap: spacing.x13,
  },
  featuredPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x8,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  featuredPillText: {
    ...Typography.body.x1M,
    color: '#032f3c',
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  featuredCopy: {
    gap: spacing.x10,
  },
  featuredTitle: {
    ...Typography.header.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  featuredDescription: {
    ...Typography.body.x1,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 32,
  },
  featuredMetaStack: {
    gap: spacing.x8,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
  },
  featuredMetaText: {
    ...Typography.body.x1M,
    color: '#FFFFFF',
    flex: 1,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.x10,
  },
  featuredTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.x8,
    flex: 1,
  },
  featuredTag: {
    borderRadius: 999,
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x5,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  featuredTagText: {
    ...Typography.body.x1M,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  featuredAction: {
    minHeight: 42,
    paddingHorizontal: spacing.x13,
    borderRadius: borderRadius.button,
    backgroundColor: CONNECT_BRAND.infoBase,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
  },
  featuredActionText: {
    ...Typography.body.x1M,
    color: '#032f3c',
    fontWeight: '800',
  },
  emptyState: {
    minHeight: 200,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x24,
    gap: spacing.x8,
  },
  emptyStateTitle: {
    ...Typography.body.x2M,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyStateBody: {
    ...Typography.body.x1,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.x10,
  },
  sectionCopy: {
    flex: 1,
    gap: spacing.x5,
  },
  sectionTitle: {
    ...Typography.header.h3,
    fontWeight: '800',
  },
  sectionBody: {
    ...Typography.body.x1,
  },
  eventCard: {
    borderRadius: 34,
    borderWidth: 1,
    padding: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x13,
  },
  eventImage: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: CONNECT_BRAND.surface,
  },
  eventCopy: {
    flex: 1,
    gap: spacing.x5,
  },
  eventTitle: {
    ...Typography.body.x2M,
    fontWeight: '800',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x5,
  },
  eventMeta: {
    ...Typography.body.x1,
    flex: 1,
  },
  eventAction: {
    minHeight: 42,
    paddingHorizontal: spacing.x13,
    borderRadius: borderRadius.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventActionText: {
    ...Typography.body.x1M,
    fontWeight: '800',
  },
  inlineEmptyState: {
    borderRadius: borderRadius.card,
    borderWidth: 1,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x13,
    gap: spacing.x5,
  },
  inlineEmptyStateTitle: {
    ...Typography.body.x1M,
    fontWeight: '700',
  },
  inlineEmptyStateBody: {
    ...Typography.body.x1,
  },
  listHeader: {
    gap: spacing.x20,
  },
  filterIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
});

export default GoLandingScreen;
