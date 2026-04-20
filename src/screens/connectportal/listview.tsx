import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import {
  STANDARD_SECONDARY_LIST_BATCH_CONFIG,
  getTabRootSpringboardPreset,
} from '@/src/navigator/motionPolicy';
import { Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import {
  createConnectPortalDraft,
  type ConnectServeJobPublished,
  formatConnectPortalDateTime,
  trackConnectPortalEventTelemetry,
} from '@/src/services/connectPortal';
import { filterConnectGoEvents } from '@/src/services/connectPortal/goEventFilters';
import { CONNECT_DEFAULT_EVENT_TYPE_OPTIONS } from '@/src/services/connectPortal/defaultEventTypes';
import { CONNECT_DEFAULT_SERVE_ROLE_OPTIONS } from '@/src/services/connectPortal/defaultServeRoles';
import filterConnectServeJobs from '@/src/services/connectPortal/serveJobFilters';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import useMountEffect from '@/src/hooks/useMountEffect';
import { type ConnectTab } from './data';
import {
  CONNECT_BRAND,
  CONNECT_BOTTOM_NAV_BASE_OFFSET,
  CONNECT_BOTTOM_SEARCH_ROW_HEIGHT,
  CONNECT_BOTTOM_STACK_GAP,
  CONNECT_GO_QUICK_CHIPS,
  CONNECT_PLACE_QUICK_CHIPS,
  ConnectPlaceCard,
  ConnectPlacesQuickChips,
  ConnectPortalChrome,
  ConnectPortalFilterSheet,
  ConnectRetractableSearchBar,
  useConnectPalette,
  useConnectKeyboardMetrics,
} from './shared';
import useSpringboardEntry from '@/src/hooks/useSpringboardEntry';
import { useRootTabSwitchReplayToken } from '@/src/navigator/RootTabTransitionContext';
import { useTabBarAnimation } from '@/src/navigator/TabBarAnimationContext';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectPortal'>;
const CONNECT_PORTAL_TAB_BAR_OWNER = 'connect-portal';

function ListItemSeparator() {
  return <View style={{ height: spacing.x13 }} />;
}

const getServeJobTags = (job: ConnectServeJobPublished) => [
  'Serve',
  ...(job.hiringStatus === 'open' ? ['Hiring'] : []),
];

function ListViewScreen({ navigation, route }: Props): React.JSX.Element {
  const rootTabReplayToken = useRootTabSwitchReplayToken('ConnectTab');
  const { getSpringboardStyle } = useSpringboardEntry(rootTabReplayToken, 3, {
    preset: getTabRootSpringboardPreset('connect'),
  });
  const { colors, dark } = useTheme();
  const palette = useConnectPalette();
  const insets = useSafeAreaInsets();
  const [chromeHeight, setChromeHeight] = useState(0);
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

  const tabBarAnimation = useTabBarAnimation();
  const tabBarAnimationRef = useRef(tabBarAnimation);
  tabBarAnimationRef.current = tabBarAnimation;
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabBarHeight = CONNECT_BOTTOM_NAV_BASE_OFFSET + insets.bottom;
  const tabBarScrollTranslate = useMemo(
    () =>
      Animated.diffClamp(scrollY, 0, tabBarHeight).interpolate({
        inputRange: [0, tabBarHeight],
        outputRange: [0, tabBarHeight],
        extrapolate: 'clamp',
      }),
    [scrollY, tabBarHeight]
  );

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

  useFocusEffect(
    useCallback(() => {
      tabBarAnimationRef.current?.setTabBarTranslateY(0, CONNECT_PORTAL_TAB_BAR_OWNER);
      const frameId = requestAnimationFrame(() => {
        tabBarAnimationRef.current?.setTabBarTranslateY(
          tabBarScrollTranslate,
          CONNECT_PORTAL_TAB_BAR_OWNER
        );
      });
      return () => {
        cancelAnimationFrame(frameId);
        tabBarAnimationRef.current?.resetTabBar(CONNECT_PORTAL_TAB_BAR_OWNER);
      };
    }, [tabBarScrollTranslate])
  );

  const eventRecords = useMemo(() => {
    return filterConnectGoEvents({
      events: snapshot.publicPublished,
      filters: go.filters,
      quickFilter: go.quickChip,
      searchText: searchByTab['Go!'],
    });
  }, [go.filters, go.quickChip, searchByTab, snapshot.publicPublished]);

  const serveItems = useMemo(() => {
    return filterConnectServeJobs({
      jobs: serve.publicRecords,
      filters: serve.filters,
      quickFilter: serve.quickChip,
      searchText: searchByTab.Serve,
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
      navigation.navigate('ConnectServeCreateJobStep1');
    }
  }, [activeTab, navigation]);

  const onChangeViewMode = (viewMode: 'list' | 'map') => {
    setViewMode(activeTab, viewMode);
    if (viewMode === 'map') {
      navigation.navigate('ConnectMap', { initialTab: activeTab });
    }
  };

  const handleTabChange = useCallback(
    (tab: ConnectTab) => {
      setActiveTab(tab);
      navigation.setParams?.({ initialTab: tab });
      scrollY.setValue(0);
    },
    [navigation, scrollY, setActiveTab]
  );

  const resolvedGoChips =
    go.eventTypeOptions.length > 0 ? go.eventTypeOptions : CONNECT_DEFAULT_EVENT_TYPE_OPTIONS;
  const resolvedServeRoleOptions =
    serve.roleTypeOptions.length > 0 ? serve.roleTypeOptions : CONNECT_DEFAULT_SERVE_ROLE_OPTIONS;

  let quickChipProps: {
    chips: string[];
    selectedChip?: string | null;
    onSelect: (chip: string) => void;
  } = {
    chips: resolvedServeRoleOptions.map((option) => option.value),
    selectedChip: serve.filters.roleType || null,
    onSelect: (chip: string) =>
      serve.setFilters({ roleType: chip === serve.filters.roleType ? '' : chip }),
  };

  if (activeTab === 'Places') {
    quickChipProps = {
      chips: CONNECT_PLACE_QUICK_CHIPS,
      selectedChip: places.quickChip,
      onSelect: (chip: string) =>
        places.setQuickChip(chip as (typeof CONNECT_PLACE_QUICK_CHIPS)[number]),
    };
  } else if (activeTab === 'Go!') {
    quickChipProps = {
      chips: resolvedGoChips.map((option) => option.value),
      selectedChip: go.filters.eventType || null,
      onSelect: (chip: string) =>
        go.setFilters({ eventType: chip === go.filters.eventType ? '' : chip }),
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
      <Animated.View style={[styles.chromeAbsolute, getSpringboardStyle(0)]}>
        <ConnectPortalChrome
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userAvatarUri={currentUser?.profileImage}
          onAddPress={activeTab !== 'Places' ? handleAddPress : undefined}
          addAccessibilityLabel={activeTab === 'Go!' ? 'Create event' : 'Create job'}
          onLayout={setChromeHeight}
        />
      </Animated.View>

      <Animated.View style={[styles.chipContentWrap, getSpringboardStyle(1)]}>
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

        <Animated.FlatList
          key={activeTab}
          data={listData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
            listener: handleListScroll,
          })}
          onEndReachedThreshold={0.5}
          contentContainerStyle={[
            styles.contentBody,
            {
              paddingTop: chromeHeight + CHIP_ROW_HEIGHT - spacing.x8,
              paddingBottom: bottomSearchClearance,
            },
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
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[styles.bottomSearchDock, { bottom: searchRowBottom }, getSpringboardStyle(2)]}
      >
        <ConnectRetractableSearchBar
          key={`connect-list-${activeTab}-${viewModes[activeTab]}`}
          searchText={searchByTab[activeTab]}
          onSearchChange={(text) => setSearchText(activeTab, text)}
          searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
          tertiaryAction={(() => {
            if (activeTab === 'Go!') {
              return {
                icon: 'eventManager' as const,
                accessibilityLabel: 'Open event management',
                onPress: () => navigation.navigate('ConnectGoEventDash'),
                testID: 'connect-go-event-manager-action',
              };
            }
            if (activeTab === 'Serve') {
              return {
                icon: 'serveManager' as const,
                accessibilityLabel: 'Open serve manager',
                onPress: () => navigation.navigate('ConnectServeHome'),
                testID: 'connect-serve-manager-action',
              };
            }
            return undefined;
          })()}
          viewToggle={{
            toMap: true,
            onPress: () => onChangeViewMode('map'),
            accessibilityLabel: 'Switch to map view',
          }}
        />
      </Animated.View>

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
          quickFilterOptions: CONNECT_GO_QUICK_CHIPS.map((chip) => ({ label: chip, value: chip })),
          quickFilterValue: go.quickChip,
          onQuickFilterChange: go.setQuickChip,
          onApply: go.setFilters,
          onReset: go.resetFilters,
        }}
        serve={{
          filters: serve.filters,
          sortOptions: serve.sortOptions,
          roleTypeOptions: resolvedServeRoleOptions,
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
  chromeAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
    marginTop: spacing.x5,
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
