import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '@/components/styled/Text';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ConnectStackParamsList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import {
  type ConnectQuickChip,
  formatConnectPortalDateTime,
  trackConnectPortalEventTelemetry,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { CONNECT_PORTAL_LIST_DATA, type ConnectTab } from './data';
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
  useConnectKeyboardMetrics,
} from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectPortal'>;

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

const getServeRoleType = (location: string) =>
  location
    .split('•')
    .map((part) => part.trim())
    .filter(Boolean)[1] || location;

function ListViewScreen({ navigation, route }: Props): React.JSX.Element {
  const { colors, dark } = useTheme();
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

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab, setActiveTab]);

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
    const filtered = CONNECT_PORTAL_LIST_DATA.Serve.filter((item) => {
      const roleType = getServeRoleType(item.location);

      if (serve.filters.roleType && normalize(roleType) !== normalize(serve.filters.roleType)) {
        return false;
      }

      if (
        serve.filters.tag &&
        !item.tags.some((tag) => normalize(tag) === normalize(serve.filters.tag))
      ) {
        return false;
      }

      if (serve.quickChip === 'Hiring' && !item.tags.some((tag) => normalize(tag) === 'hiring')) {
        return false;
      }

      if (serve.quickChip === 'Part-time' && normalize(roleType) !== 'part-time') {
        return false;
      }

      if (serve.quickChip === 'Full-time' && normalize(roleType) !== 'full-time') {
        return false;
      }

      if (serve.quickChip === 'Serve' && !item.tags.some((tag) => normalize(tag) === 'serve')) {
        return false;
      }

      return matchesSearch(searchQuery, [item.title, item.location, roleType, ...item.tags]);
    });

    return [...filtered].sort((left, right) => {
      if (serve.filters.sort === 'role_type') {
        return getServeRoleType(left.location).localeCompare(getServeRoleType(right.location));
      }

      if (serve.filters.sort === 'nearest_match') {
        return left.location.localeCompare(right.location);
      }

      return left.title.localeCompare(right.title);
    });
  }, [searchByTab.Serve, serve.filters, serve.quickChip]);

  let sectionTitle = 'Open Opportunities';
  if (activeTab === 'Places') {
    sectionTitle = 'Recommended for You';
  } else if (activeTab === 'Go!') {
    sectionTitle = 'Upcoming Events';
  }

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
          headerActionIconName="map"
          headerActionAccessibilityLabel="Switch to map view"
          onHeaderActionPress={() => onChangeViewMode('map')}
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleListScroll}
          contentContainerStyle={[
            styles.contentBody,
            { paddingTop: CHIP_ROW_HEIGHT, paddingBottom: bottomSearchClearance },
          ]}
        >
          <View style={styles.sectionHeader}>
            <StyledText
              style={[styles.sectionTitle, { color: dark ? CONNECT_BRAND.gray100 : '#032f3c' }]}
            >
              {sectionTitle}
            </StyledText>
            <TouchableOpacity activeOpacity={0.8}>
              <StyledText style={styles.viewAllText}>View All</StyledText>
            </TouchableOpacity>
          </View>

          {activeTab === 'Places'
            ? places.visibleRecords.map((place) => (
                <ConnectPlaceCard
                  key={place.id}
                  place={place}
                  isFollowing={places.isFollowing(place.id)}
                  onToggleFollow={() => places.toggleFollow(place.id)}
                />
              ))
            : null}

          {activeTab === 'Go!'
            ? eventRecords.map((eventRecord) => (
                <TouchableOpacity
                  key={eventRecord.id}
                  style={[styles.genericCard, { backgroundColor: colors.card }]}
                  onPress={() => {
                    trackConnectPortalEventTelemetry(eventRecord.id, 'detail_open', {
                      source: 'connect_list',
                    }).catch(() => {});
                    navigation.navigate('ConnectGoEventView', { eventId: eventRecord.id });
                  }}
                >
                  <MaterialIcons name="event" size={28} color={CONNECT_BRAND.infoBase} />
                  <View style={styles.genericCardCopy}>
                    <StyledText style={styles.genericCardTitle}>{eventRecord.title}</StyledText>
                    <StyledText style={styles.genericCardSubtitle}>
                      {`${eventRecord.venueName || eventRecord.address || 'Location TBD'} • ${formatConnectPortalDateTime(eventRecord)}`}
                    </StyledText>
                    <View style={styles.genericTagsRow}>
                      {(eventRecord.tags.length > 0 ? eventRecord.tags : ['Event']).map((tag) => (
                        <View key={`${eventRecord.id}-${tag}`} style={styles.genericTag}>
                          <StyledText style={styles.genericTagText}>{tag.toUpperCase()}</StyledText>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            : null}

          {activeTab === 'Serve'
            ? serveItems.map((item) => (
                <View key={item.id} style={[styles.genericCard, { backgroundColor: colors.card }]}>
                  <MaterialIcons
                    name="volunteer-activism"
                    size={28}
                    color={CONNECT_BRAND.infoBase}
                  />
                  <View style={styles.genericCardCopy}>
                    <StyledText style={styles.genericCardTitle}>{item.title}</StyledText>
                    <StyledText style={styles.genericCardSubtitle}>{item.location}</StyledText>
                    <View style={styles.genericTagsRow}>
                      {item.tags.map((tag) => (
                        <View key={`${item.id}-${tag}`} style={styles.genericTag}>
                          <StyledText style={styles.genericTagText}>{tag.toUpperCase()}</StyledText>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))
            : null}
        </ScrollView>
      </View>

      <View pointerEvents="box-none" style={[styles.bottomSearchDock, { bottom: searchRowBottom }]}>
        <ConnectRetractableSearchBar
          key={`connect-list-${activeTab}-${viewModes[activeTab]}`}
          searchText={searchByTab[activeTab]}
          onSearchChange={(text) => setSearchText(activeTab, text)}
          searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
          onOpenFilters={openFilterSheet}
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
  viewAllText: {
    ...Typography.body.x1M,
    color: CONNECT_BRAND.infoBase,
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
    color: Colors.neutral.brand,
    fontWeight: '700',
  },
  genericCardSubtitle: {
    ...Typography.body.x1,
    color: Colors.neutral[500],
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
    backgroundColor: 'rgba(65,137,159,0.2)',
  },
  genericTagText: {
    color: CONNECT_BRAND.infoBase,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ListViewScreen;
