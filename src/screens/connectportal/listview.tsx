import React, { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilterSortIcon from '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg';
import StyledText from '@/components/styled/Text';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ConnectStackParamsList } from '@/src/navigator/types';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import { Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import {
  createConnectServeJobDraft,
  createConnectPortalDraft,
  type ConnectQuickChip,
  formatConnectPortalDateTime,
  trackConnectPortalEventTelemetry,
  ConnectServeJobPublished,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import useMountEffect from '@/src/hooks/useMountEffect';
import type { ConnectTab } from './data';
import {
  CONNECT_BRAND,
  CONNECT_BOTTOM_NAV_BASE_OFFSET,
  CONNECT_BOTTOM_SEARCH_ROW_HEIGHT,
  CONNECT_BOTTOM_STACK_GAP,
  CONNECT_GO_QUICK_CHIPS,
  CONNECT_PLACE_QUICK_CHIPS,
  CONNECT_SERVE_QUICK_CHIPS,
  ConnectPlaceCard,
  ConnectPlacesQuickChips,
  ConnectPortalChrome,
  ConnectPortalFilterSheet,
  ConnectRetractableSearchBar,
  useConnectPalette,
  useConnectKeyboardMetrics,
} from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectPortal'>;

function ListItemSeparator() {
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

const getServeRoleType = (job: Pick<ConnectServeJobPublished, 'opportunityType'>) =>
  job.opportunityType;

const getServeJobTags = (job: ConnectServeJobPublished) => {
  const tags = ['Serve'];
  if (job.hiringStatus === 'open') {
    tags.push('Hiring');
  }
  if (job.sector) {
    tags.push(job.sector);
  }
  return tags;
};

function ListViewScreen({ navigation, route }: Props): React.JSX.Element {
  const { dark, colors } = useTheme();
  const palette = useConnectPalette();
  const insets = useSafeAreaInsets();
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const {
    snapshot,
    refresh,
    activeTab,
    setActiveTab,
    viewModes,
    setViewMode,
    searchByTab,
    setSearchText,
    places,
    go,
    serve,
  } = useConnectPortalData();
  const { keyboardHeight, keyboardVisible } = useConnectKeyboardMetrics();

  const CHIP_ROW_HEIGHT = 46;
  const chipOffset = useRef(new Animated.Value(0)).current;
  const lastScrollRef = useRef(0);
  const chipHiddenRef = useRef(false);

  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { nativeEvent } = event;
      const { contentOffset } = nativeEvent;
      const { y } = contentOffset;
      const diff = y - lastScrollRef.current;
      lastScrollRef.current = y;

      if (y <= 0) {
        if (chipHiddenRef.current) {
          chipHiddenRef.current = false;
          Animated.timing(chipOffset, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      } else if (diff > 2 && !chipHiddenRef.current) {
        chipHiddenRef.current = true;
        Animated.timing(chipOffset, {
          toValue: -CHIP_ROW_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (diff < -2 && chipHiddenRef.current) {
        chipHiddenRef.current = false;
        Animated.timing(chipOffset, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
    [chipOffset]
  );

  useMountEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  });

  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'Go!') {
        refresh();
      }
    }, [activeTab, refresh])
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

  const serveItems = useMemo(() => {
    const searchQuery = normalize(searchByTab.Serve);
    const filtered = serve.publicRecords.filter((job) => {
      const roleType = getServeRoleType(job);
      const tags = getServeJobTags(job);

      if (serve.filters.roleType && normalize(roleType) !== normalize(serve.filters.roleType)) {
        return false;
      }

      if (serve.filters.tag && normalize(job.sector) !== normalize(serve.filters.tag)) {
        return false;
      }

      if (serve.quickChip === 'Hiring' && job.hiringStatus !== 'open') {
        return false;
      }

      if (serve.quickChip === 'Part-time' && normalize(roleType) !== 'part-time') {
        return false;
      }

      if (serve.quickChip === 'Full-time' && normalize(roleType) !== 'full-time') {
        return false;
      }

      if (serve.quickChip === 'Serve' && !tags.some((tag) => normalize(tag) === 'serve')) {
        return false;
      }

      return matchesSearch(searchQuery, [job.title, job.address, job.sector, roleType, ...tags]);
    });

    return [...filtered].sort((left, right) => {
      if (serve.filters.sort === 'role_type') {
        return getServeRoleType(left).localeCompare(getServeRoleType(right));
      }

      if (serve.filters.sort === 'nearest_match') {
        return left.address.localeCompare(right.address);
      }

      return left.title.localeCompare(right.title);
    });
  }, [searchByTab.Serve, serve.filters, serve.publicRecords, serve.quickChip]);

  let sectionTitle = 'Open Opportunities';
  if (activeTab === 'Places') {
    sectionTitle = 'Recommended for You';
  } else if (activeTab === 'Go!') {
    sectionTitle = 'Upcoming Events';
  }

  const listData: { id: string }[] = useMemo(() => {
    if (activeTab === 'Places') return places.visibleRecords;
    if (activeTab === 'Go!') return eventRecords;
    return serveItems;
  }, [activeTab, places.visibleRecords, eventRecords, serveItems]);

  const handleAddPress = useCallback(() => {
    if (activeTab === 'Go!') {
      createConnectPortalDraft().then((draft) => {
        navigation.navigate('ConnectGoCreateStep1', { draftId: draft.id });
      });
      return;
    }
    if (activeTab === 'Serve') {
      createConnectServeJobDraft().then((draft) => {
        navigation.navigate('ConnectServeCreateJobStep1', { draftId: draft.id });
      });
    }
  }, [activeTab, navigation]);

  const onChangeViewMode = (viewMode: 'list' | 'map') => {
    setViewMode(activeTab, viewMode);
    if (viewMode === 'map') {
      navigation.navigate('ConnectMap', { initialTab: activeTab });
    }
  };

  let quickChipProps: {
    chips: ConnectQuickChip[];
    selectedChip: ConnectQuickChip;
    onSelect: (chip: ConnectQuickChip) => void;
  } = {
    chips: CONNECT_SERVE_QUICK_CHIPS,
    selectedChip: serve.quickChip,
    onSelect: (chip: ConnectQuickChip) =>
      serve.setQuickChip(chip as (typeof CONNECT_SERVE_QUICK_CHIPS)[number]),
  };

  if (activeTab === 'Places') {
    quickChipProps = {
      chips: CONNECT_PLACE_QUICK_CHIPS,
      selectedChip: places.quickChip,
      onSelect: (chip: ConnectQuickChip) =>
        places.setQuickChip(chip as (typeof CONNECT_PLACE_QUICK_CHIPS)[number]),
    };
  } else if (activeTab === 'Go!') {
    quickChipProps = {
      chips: CONNECT_GO_QUICK_CHIPS,
      selectedChip: go.quickChip,
      onSelect: (chip: ConnectQuickChip) =>
        go.setQuickChip(chip as (typeof CONNECT_GO_QUICK_CHIPS)[number]),
    };
  }

  let filterSheetVisible = serve.filterSheetOpen;
  if (activeTab === 'Places') {
    filterSheetVisible = places.filterSheetOpen;
  } else if (activeTab === 'Go!') {
    filterSheetVisible = go.filterSheetOpen;
  }

  const closeFilterSheet = () => {
    if (activeTab === 'Places') {
      places.setFilterSheetOpen(false);
      return;
    }

    if (activeTab === 'Go!') {
      go.setFilterSheetOpen(false);
      return;
    }

    serve.setFilterSheetOpen(false);
  };

  const openFilterSheet = () => {
    if (activeTab === 'Places') {
      places.setFilterSheetOpen(true);
      return;
    }

    if (activeTab === 'Go!') {
      go.setFilterSheetOpen(true);
      return;
    }

    serve.setFilterSheetOpen(true);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ zIndex: 1, position: 'relative' }}>
        <ConnectPortalChrome
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userAvatarUri={currentUser?.profileImage}
          onAddPress={activeTab !== 'Places' ? handleAddPress : undefined}
          addAccessibilityLabel={activeTab === 'Go!' ? 'Create event' : 'Create job'}
          headerActionIconName={activeTab === 'Places' ? 'map' : undefined}
          headerActionAccessibilityLabel={activeTab === 'Places' ? 'Switch to map view' : undefined}
          onHeaderActionPress={activeTab === 'Places' ? () => onChangeViewMode('map') : undefined}
        />
      </View>

      <View style={styles.chipContentWrap}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            transform: [{ translateY: chipOffset }],
          }}
        >
          <ConnectPlacesQuickChips
            chips={quickChipProps.chips}
            selectedChip={quickChipProps.selectedChip}
            onSelect={quickChipProps.onSelect}
          />
        </Animated.View>

        <FlatList
          key={activeTab}
          data={listData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleListScroll}
          onEndReachedThreshold={0.5}
          contentContainerStyle={[
            styles.contentBody,
            { paddingTop: CHIP_ROW_HEIGHT, paddingBottom: bottomSearchClearance },
          ]}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <StyledText
                style={[styles.sectionTitle, { color: dark ? CONNECT_BRAND.gray100 : '#032f3c' }]}
              >
                {sectionTitle}
              </StyledText>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={openFilterSheet}
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
          }
          renderItem={({ item }) => {
            if (activeTab === 'Places') {
              const place = item as (typeof places.visibleRecords)[number];
              return (
                <ConnectPlaceCard
                  place={place}
                  isFollowing={places.isFollowing(place.id)}
                  onToggleFollow={() => places.toggleFollow(place.id)}
                />
              );
            }

            if (activeTab === 'Go!') {
              const eventRecord = item as (typeof eventRecords)[number];
              return (
                <TouchableOpacity
                  style={[styles.genericCard, { backgroundColor: palette.cardMuted }]}
                  onPress={() => {
                    trackConnectPortalEventTelemetry(eventRecord.id, 'detail_open', {
                      source: 'connect_list',
                    }).catch(() => {});
                    navigation.navigate('ConnectGoEventView', { eventId: eventRecord.id });
                  }}
                >
                  <MaterialIcons name="event" size={28} color={palette.activeText} />
                  <View style={styles.genericCardCopy}>
                    <StyledText style={[styles.genericCardTitle, { color: palette.textPrimary }]}>
                      {eventRecord.title}
                    </StyledText>
                    <StyledText
                      style={[styles.genericCardSubtitle, { color: palette.textSecondary }]}
                    >
                      {`${eventRecord.venueName || eventRecord.address || 'Location TBD'} • ${formatConnectPortalDateTime(eventRecord)}`}
                    </StyledText>
                    <View style={styles.genericTagsRow}>
                      {(eventRecord.tags.length > 0 ? eventRecord.tags : ['Event']).map((tag) => (
                        <View
                          key={`${eventRecord.id}-${tag}`}
                          style={[styles.genericTag, { backgroundColor: palette.tagBg }]}
                        >
                          <StyledText
                            style={[styles.genericTagText, { color: palette.activeText }]}
                          >
                            {tag.toUpperCase()}
                          </StyledText>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            const serveItem = item as (typeof serveItems)[number];
            return (
              <TouchableOpacity
                style={[styles.genericCard, { backgroundColor: palette.cardMuted }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ConnectServeJobView', { jobId: serveItem.id })}
              >
                <MaterialIcons name="volunteer-activism" size={28} color={palette.activeText} />
                <View style={styles.genericCardCopy}>
                  <StyledText style={[styles.genericCardTitle, { color: palette.textPrimary }]}>
                    {serveItem.title}
                  </StyledText>
                  <StyledText
                    style={[styles.genericCardSubtitle, { color: palette.textSecondary }]}
                  >
                    {[serveItem.address, serveItem.opportunityType].filter(Boolean).join(' • ')}
                  </StyledText>
                  <View style={styles.genericTagsRow}>
                    {getServeJobTags(serveItem).map((tag) => (
                      <View
                        key={`${serveItem.id}-${tag}`}
                        style={[styles.genericTag, { backgroundColor: palette.tagBg }]}
                      >
                        <StyledText style={[styles.genericTagText, { color: palette.activeText }]}>
                          {tag.toUpperCase()}
                        </StyledText>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={ListItemSeparator}
          removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
          initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
          maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
          updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
          windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
        />
      </View>

      <View pointerEvents="box-none" style={[styles.bottomSearchDock, { bottom: searchRowBottom }]}>
        <ConnectRetractableSearchBar
          key={`connect-list-${activeTab}-${viewModes[activeTab]}`}
          searchText={searchByTab[activeTab]}
          onSearchChange={(text) => setSearchText(activeTab, text)}
          searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
          tertiaryAction={
            activeTab === 'Go!'
              ? {
                  icon: 'eventManager',
                  accessibilityLabel: 'Open event management',
                  onPress: () => navigation.navigate('ConnectGoEventDash'),
                  testID: 'connect-go-event-manager-action',
                }
              : activeTab === 'Serve'
                ? {
                    icon: 'serveManager',
                    accessibilityLabel: 'Open serve manager',
                    onPress: () => navigation.navigate('ConnectServeHome'),
                    testID: 'connect-serve-manager-action',
                  }
                : undefined
          }
          viewToggle={
            activeTab !== 'Places'
              ? {
                  toMap: true,
                  onPress: () => onChangeViewMode('map'),
                  accessibilityLabel: 'Switch to map view',
                }
              : undefined
          }
        />
      </View>

      <ConnectPortalFilterSheet
        visible={filterSheetVisible}
        activeTab={activeTab as ConnectTab}
        onClose={closeFilterSheet}
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
  chipContentWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  contentBody: {
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x104,
    gap: spacing.x13,
  },
  bottomSearchDock: {
    position: 'absolute',
    left: spacing.x16,
    right: spacing.x16,
    zIndex: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.x10,
    marginBottom: spacing.x10,
  },
  sectionTitle: {
    ...Typography.header.h3,
    color: CONNECT_BRAND.gray100,
  },
  filterIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  genericCard: {
    borderRadius: borderRadius.large,
    padding: spacing.x16,
    flexDirection: 'row',
    gap: spacing.x13,
    alignItems: 'flex-start',
  },
  genericCardCopy: {
    flex: 1,
    gap: spacing.x8,
  },
  genericCardTitle: {
    ...Typography.body.x2M,
    fontWeight: '700',
  },
  genericCardSubtitle: {
    ...Typography.body.x1,
  },
  genericTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.x8,
  },
  genericTag: {
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x5,
    borderRadius: borderRadius.button,
  },
  genericTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ListViewScreen;
