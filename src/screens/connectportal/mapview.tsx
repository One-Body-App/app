import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Platform, StyleSheet, Pressable, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import StyledText from '@/components/styled/Text';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MAPBOX_PUBLIC_TOKEN } from '@/services/constants';
import { ConnectStackParamsList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import getDeviceLocation from '@/src/services/deviceLocation';
import {
  createConnectPortalDraft,
  formatConnectPortalDateTime,
  trackConnectPortalEventTelemetry,
} from '@/src/services/connectPortal';
import { filterConnectGoEvents } from '@/src/services/connectPortal/goEventFilters';
import { CONNECT_DEFAULT_EVENT_TYPE_OPTIONS } from '@/src/services/connectPortal/defaultEventTypes';
import { CONNECT_DEFAULT_SERVE_ROLE_OPTIONS } from '@/src/services/connectPortal/defaultServeRoles';
import filterConnectServeJobs from '@/src/services/connectPortal/serveJobFilters';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import useMountEffect from '@/src/hooks/useMountEffect';
import { type ConnectPortalMapItem, type Coordinate } from './data';
import {
  CONNECT_BRAND,
  CONNECT_BOTTOM_CHIP_RAIL_HEIGHT,
  CONNECT_BOTTOM_NAV_BASE_OFFSET,
  CONNECT_BOTTOM_SEARCH_ROW_HEIGHT,
  CONNECT_BOTTOM_STACK_GAP,
  CONNECT_GO_QUICK_CHIPS,
  ConnectMapFloatingCard,
  ConnectMapMarker,
  ConnectPortalChrome,
  ConnectPortalFilterSheet,
  ConnectRetractableSearchBar,
  ConnectPlacesQuickChips,
  useConnectKeyboardMetrics,
} from './shared';
import useSpringboardEntry from '@/src/hooks/useSpringboardEntry';
import { getTabRootSpringboardPreset } from '@/src/navigator/motionPolicy';
import { useRootTabSwitchReplayToken } from '@/src/navigator/RootTabTransitionContext';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectMap'>;

const mapboxAccessToken = String(MAPBOX_PUBLIC_TOKEN ?? '').trim();

type MapboxModule = {
  Camera: React.ComponentType<any>;
  MapView: React.ComponentType<any>;
  PointAnnotation?: React.ComponentType<any>;
  MarkerView?: React.ComponentType<any>;
  StyleURL?: {
    Street?: string;
    Dark?: string;
  };
  setAccessToken?: (token: string) => void;
};

function resolveMapboxModule(): MapboxModule | null {
  try {
    // eslint-disable-next-line global-require
    const maybeMapbox = require('@rnmapbox/maps');
    const candidate = maybeMapbox?.default ?? maybeMapbox;

    if (
      !candidate?.MapView ||
      !candidate?.Camera ||
      (!candidate?.MarkerView && !candidate?.PointAnnotation)
    ) {
      return null;
    }

    if (candidate?.setAccessToken && mapboxAccessToken) {
      candidate.setAccessToken(mapboxAccessToken);
    }

    return candidate as MapboxModule;
  } catch {
    return null;
  }
}

const DEFAULT_CENTER: Coordinate = [-84.388, 33.749];

function getMarkerIcon(itemType: ConnectPortalMapItem['type']) {
  if (itemType === 'event') return 'calendar-star';
  if (itemType === 'job') return 'hand-heart';
  return 'home-city-outline';
}

function createConnectMapStyle(darkMode: boolean) {
  const labelColor = darkMode ? '#e3ecee' : '#53676d';
  const labelHalo = darkMode ? 'rgba(74,88,94,0.94)' : 'rgba(245,249,250,0.98)';
  const subduedLabelColor = darkMode ? '#c5d2d6' : '#687d84';
  const subduedLabelHalo = darkMode ? 'rgba(86,99,104,0.92)' : 'rgba(248,251,252,0.98)';

  return JSON.stringify({
    version: 8,
    name: darkMode ? 'ConnectPortalDark' : 'ConnectPortalLight',
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    sources: {
      composite: {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': darkMode ? '#5a6971' : '#edf3f4',
        },
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'composite',
        'source-layer': 'landuse',
        paint: {
          'fill-color': darkMode ? '#66767c' : '#dfe7ea',
          'fill-opacity': darkMode ? 0.28 : 0.34,
        },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'composite',
        'source-layer': 'water',
        paint: {
          'fill-color': darkMode ? '#51616a' : '#d7e3e8',
          'fill-opacity': 0.92,
        },
      },
      {
        id: 'admin',
        type: 'line',
        source: 'composite',
        'source-layer': 'admin',
        paint: {
          'line-color': darkMode ? '#8a989d' : '#bfcad0',
          'line-opacity': darkMode ? 0.14 : 0.18,
          'line-width': 1,
        },
      },
      {
        id: 'roads',
        type: 'line',
        source: 'composite',
        'source-layer': 'road',
        paint: {
          'line-color': darkMode ? '#97a5aa' : '#b5c3c8',
          'line-opacity': darkMode ? 0.2 : 0.28,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 13, 1.1, 16, 2.1],
        },
      },
      {
        id: 'roads-major',
        type: 'line',
        source: 'composite',
        'source-layer': 'road',
        filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
        paint: {
          'line-color': darkMode ? '#b0bcc0' : '#9dadb4',
          'line-opacity': darkMode ? 0.24 : 0.32,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 13, 1.8, 16, 3],
        },
      },
      {
        id: 'building',
        type: 'fill',
        source: 'composite',
        'source-layer': 'building',
        minzoom: 13,
        paint: {
          'fill-color': darkMode ? '#758489' : '#c9d4d8',
          'fill-opacity': darkMode ? 0.14 : 0.18,
        },
      },
      {
        id: 'poi-dots',
        type: 'circle',
        source: 'composite',
        'source-layer': 'poi_label',
        minzoom: 11,
        paint: {
          'circle-color': darkMode ? '#53d7df' : '#65ccd4',
          'circle-opacity': darkMode ? 0.4 : 0.22,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 1.4],
        },
      },
      {
        id: 'road-labels',
        type: 'symbol',
        source: 'composite',
        'source-layer': 'road',
        minzoom: 12,
        filter: ['all', ['has', 'name']],
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 14],
          'symbol-spacing': 280,
        },
        paint: {
          'text-color': subduedLabelColor,
          'text-halo-color': subduedLabelHalo,
          'text-halo-width': 1.4,
          'text-opacity': 0.88,
        },
      },
      {
        id: 'settlement-labels',
        type: 'symbol',
        source: 'composite',
        'source-layer': 'place_label',
        minzoom: 5,
        filter: ['match', ['get', 'class'], ['settlement'], true, false],
        layout: {
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12, 10, 18],
          'text-letter-spacing': 0.02,
        },
        paint: {
          'text-color': labelColor,
          'text-halo-color': labelHalo,
          'text-halo-width': 1.8,
          'text-opacity': 0.96,
        },
      },
      {
        id: 'state-labels',
        type: 'symbol',
        source: 'composite',
        'source-layer': 'place_label',
        minzoom: 4,
        filter: ['match', ['get', 'class'], ['state', 'province'], true, false],
        layout: {
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 8, 14],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.18,
        },
        paint: {
          'text-color': subduedLabelColor,
          'text-halo-color': subduedLabelHalo,
          'text-halo-width': 1.5,
          'text-opacity': 0.84,
        },
      },
    ],
  });
}

const CONNECT_MAP_STYLE_DARK = createConnectMapStyle(true);
const CONNECT_MAP_STYLE_LIGHT = createConnectMapStyle(false);

function MapViewScreen({ navigation, route }: Props): React.JSX.Element {
  const rootTabReplayToken = useRootTabSwitchReplayToken('ConnectTab');
  const { getSpringboardStyle } = useSpringboardEntry(rootTabReplayToken, 3, {
    preset: getTabRootSpringboardPreset('connect'),
  });
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const mapbox = useMemo(() => resolveMapboxModule(), []);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const {
    snapshot,
    refresh,
    activeTab,
    setActiveTab,
    setViewMode,
    searchByTab,
    setSearchText,
    go,
    places,
    serve,
  } = useConnectPortalData();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [initialCameraTarget, setInitialCameraTarget] = useState<Coordinate>(DEFAULT_CENTER);
  const { keyboardHeight, keyboardVisible } = useConnectKeyboardMetrics();
  const mapStyleJSON = dark ? CONNECT_MAP_STYLE_DARK : CONNECT_MAP_STYLE_LIGHT;

  useMountEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }

    let isMounted = true;

    getDeviceLocation()
      .then((location) => {
        if (!isMounted || !location) {
          return;
        }

        setInitialCameraTarget([location.longitude, location.latitude]);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  });

  const goEventRecords = useMemo(
    () =>
      filterConnectGoEvents({
        events: snapshot.publicPublished,
        filters: go.filters,
        quickFilter: go.quickChip,
        searchText: searchByTab['Go!'],
      }),
    [go.filters, go.quickChip, searchByTab, snapshot.publicPublished]
  );

  const activeItems = useMemo(() => {
    if (activeTab === 'Places') {
      return places.visibleRecords.map((record) => ({
        id: record.id,
        title: record.title,
        subtitle:
          [record.organizationTypeLabel, record.churchTypeLabel].filter(Boolean).join(' • ') ||
          'Organization',
        address: record.address,
        coordinate: record.coordinate || DEFAULT_CENTER,
        type: 'organization' as const,
      }));
    }

    if (activeTab === 'Go!') {
      return goEventRecords.map((eventRecord) => ({
        id: eventRecord.id,
        title: eventRecord.title,
        subtitle: `${eventRecord.startDate || 'Date TBD'}${eventRecord.startTime ? ` • ${eventRecord.startTime}` : ''}`,
        address: eventRecord.address || eventRecord.venueName || 'Location TBD',
        coordinate: eventRecord.coordinate || DEFAULT_CENTER,
        type: 'event' as const,
      }));
    }

    const filteredServeRecords = filterConnectServeJobs({
      jobs: serve.publicRecords,
      filters: serve.filters,
      quickFilter: serve.quickChip,
      searchText: searchByTab.Serve,
    });

    return filteredServeRecords.map((job) => ({
      id: job.id,
      title: job.title,
      subtitle: job.opportunityType || 'Serve Opportunity',
      address: job.address || 'Location TBD',
      coordinate: job.coordinate || DEFAULT_CENTER,
      type: 'job' as const,
    }));
  }, [
    activeTab,
    goEventRecords,
    places.visibleRecords,
    serve.publicRecords,
    serve.filters,
    serve.quickChip,
    searchByTab.Serve,
  ]);

  const validSelectedItemId =
    selectedItemId && activeItems.some((item) => item.id === selectedItemId)
      ? selectedItemId
      : null;

  const clearSelection = useCallback(() => {
    places.selectPlace(null);
    setSelectedItemId(null);
  }, [places]);

  const selectedPlace =
    activeTab === 'Places'
      ? places.visibleRecords.find((place) => place.id === places.selectedPlaceId)
      : null;
  const selectedEvent =
    activeTab === 'Go!'
      ? goEventRecords.find((eventRecord) => eventRecord.id === validSelectedItemId) || null
      : null;
  const selectedServeItem =
    activeTab === 'Serve'
      ? activeItems.find((item) => item.id === validSelectedItemId && item.type === 'job') || null
      : null;

  const onChangeViewMode = (viewMode: 'list' | 'map') => {
    setViewMode(activeTab, viewMode);
    if (viewMode === 'list') {
      navigation.navigate('ConnectPortal', { initialTab: activeTab });
    }
  };

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

  const onChangeTab = (tab: typeof activeTab) => {
    clearSelection();
    setActiveTab(tab);
    navigation.setParams?.({ initialTab: tab });
    if (tab === 'Go!') {
      refresh();
    }
  };

  const handleMarkerPress = (item: (typeof activeItems)[number]) => {
    if (activeTab === 'Places') {
      places.selectPlace(item.id);
      return;
    }

    setSelectedItemId(item.id);

    if (activeTab === 'Go!') {
      trackConnectPortalEventTelemetry(item.id, 'detail_open', {
        source: 'connect_map_marker',
      }).catch(() => {});
    }
  };

  const showBottomChips =
    (activeTab === 'Places' || activeTab === 'Go!' || activeTab === 'Serve') && !keyboardVisible;
  const chipRailBottom = insets.bottom + CONNECT_BOTTOM_NAV_BASE_OFFSET;
  const searchRowBottom = keyboardVisible
    ? keyboardHeight + CONNECT_BOTTOM_STACK_GAP
    : chipRailBottom +
      (showBottomChips ? CONNECT_BOTTOM_CHIP_RAIL_HEIGHT + CONNECT_BOTTOM_STACK_GAP : 0);
  const previewRailBottom =
    searchRowBottom + CONNECT_BOTTOM_SEARCH_ROW_HEIGHT + CONNECT_BOTTOM_STACK_GAP;

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

  const floatingCard = useMemo(() => {
    if (selectedPlace) {
      return (
        <ConnectMapFloatingCard
          eyebrow="Featured Organization"
          title={selectedPlace.title}
          meta={selectedPlace.distanceLabel ? `${selectedPlace.distanceLabel} away` : 'Nearby'}
          supportingCopy={selectedPlace.isOpen ? 'Open now' : 'Active now'}
          imageUri={selectedPlace.avatarUri}
          fallbackIcon="home-city-outline"
          trailingIconName={places.isFollowing(selectedPlace.id) ? 'favorite' : 'favorite-border'}
          primaryAction={{
            label: places.isFollowing(selectedPlace.id) ? 'Following' : 'Follow',
            onPress: () => {
              places.toggleFollow(selectedPlace.id);
            },
          }}
          secondaryAction={{
            label: 'Details',
            onPress: () => navigation.navigate('UserProfile', { id: selectedPlace.id }),
            variant: 'secondary',
          }}
          onDismiss={clearSelection}
        />
      );
    }

    if (selectedEvent) {
      return (
        <ConnectMapFloatingCard
          eyebrow="Upcoming Event"
          title={selectedEvent.title}
          meta={selectedEvent.address || selectedEvent.venueName || 'Location TBD'}
          supportingCopy={formatConnectPortalDateTime(selectedEvent) || 'Upcoming event'}
          imageUri={selectedEvent.photoUri || selectedEvent.heroImageUri}
          fallbackIcon="calendar-star"
          trailingIconName="event"
          primaryAction={{
            label: 'Details',
            onPress: () => {
              trackConnectPortalEventTelemetry(selectedEvent.id, 'detail_open', {
                source: 'connect_map_card',
              }).catch(() => {});
              navigation.navigate('ConnectGoEventView', { eventId: selectedEvent.id });
            },
          }}
          onDismiss={clearSelection}
        />
      );
    }

    if (selectedServeItem) {
      return (
        <ConnectMapFloatingCard
          eyebrow="Serve Opportunity"
          title={selectedServeItem.title}
          meta={selectedServeItem.address}
          supportingCopy={selectedServeItem.subtitle}
          fallbackIcon="hand-heart"
          trailingIconName="volunteer-activism"
          primaryAction={{
            label: 'Details',
            onPress: () =>
              navigation.navigate('ConnectServeJobView', { jobId: selectedServeItem.id }),
          }}
          onDismiss={clearSelection}
        />
      );
    }

    return null;
  }, [clearSelection, navigation, places, selectedEvent, selectedPlace, selectedServeItem]);

  const renderBottomChips = () => {
    if (activeTab === 'Places') {
      return (
        <ConnectPlacesQuickChips
          selectedChip={places.quickChip}
          onSelect={places.setQuickChip}
          variant="bottomOverlay"
        />
      );
    }

    if (activeTab === 'Serve') {
      const resolvedServeRoleOptions =
        serve.roleTypeOptions.length > 0
          ? serve.roleTypeOptions
          : CONNECT_DEFAULT_SERVE_ROLE_OPTIONS;
      return (
        <ConnectPlacesQuickChips
          chips={resolvedServeRoleOptions.map((option) => option.value)}
          selectedChip={serve.filters.roleType || null}
          onSelect={(chip) =>
            serve.setFilters({ roleType: chip === serve.filters.roleType ? '' : chip })
          }
          variant="bottomOverlay"
        />
      );
    }

    const resolvedGoChips =
      go.eventTypeOptions.length > 0 ? go.eventTypeOptions : CONNECT_DEFAULT_EVENT_TYPE_OPTIONS;
    return (
      <ConnectPlacesQuickChips
        chips={resolvedGoChips.slice(0, 7).map((option) => option.value)}
        selectedChip={go.filters.eventType || null}
        onSelect={(chip) => go.setFilters({ eventType: chip === go.filters.eventType ? '' : chip })}
        variant="bottomOverlay"
        actionChip={
          go.eventTypeOptions.length > 7
            ? {
                label: 'See all',
                onPress: () => onChangeViewMode('list'),
                testID: 'connect-go-map-see-all-chip',
              }
            : undefined
        }
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Platform.OS === 'android' ? 'transparent' : colors.background },
      ]}
    >
      {mapbox ? (
        <mapbox.MapView
          style={styles.map}
          styleJSON={mapStyleJSON}
          logoEnabled={false}
          attributionEnabled={false}
          scaleBarEnabled={false}
          compassEnabled={false}
          rotateEnabled={false}
        >
          <mapbox.Camera
            zoomLevel={10.3}
            centerCoordinate={initialCameraTarget}
            animationDuration={300}
          />

          {activeItems.map((item) => {
            const isSelected =
              activeTab === 'Places'
                ? item.id === places.selectedPlaceId
                : item.id === validSelectedItemId;
            const markerContent = (
              <Pressable onPress={() => handleMarkerPress(item)} style={styles.markerTapTarget}>
                <ConnectMapMarker iconName={getMarkerIcon(item.type)} active={isSelected} />
              </Pressable>
            );

            if (mapbox.MarkerView) {
              return (
                <mapbox.MarkerView
                  key={item.id}
                  id={item.id}
                  coordinate={item.coordinate}
                  anchor={{ x: 0.5, y: 0.9 }}
                >
                  {markerContent}
                </mapbox.MarkerView>
              );
            }

            if (!mapbox.PointAnnotation) {
              return null;
            }

            return (
              <mapbox.PointAnnotation
                key={item.id}
                id={item.id}
                coordinate={item.coordinate}
                onSelected={() => handleMarkerPress(item)}
              >
                {markerContent}
              </mapbox.PointAnnotation>
            );
          })}
        </mapbox.MapView>
      ) : (
        <View style={[styles.mapFallback, { backgroundColor: colors.card }]}>
          <MaterialIcons name="map" size={28} color={CONNECT_BRAND.infoBase} />
          <StyledText
            style={[styles.mapFallbackTitle, { color: dark ? CONNECT_BRAND.gray100 : '#032f3c' }]}
          >
            Map view unavailable
          </StyledText>
          <StyledText
            style={[styles.mapFallbackBody, { color: dark ? Colors.neutral[500] : '#4f6d77' }]}
          >
            Rebuild the app to finish linking Mapbox native modules.
          </StyledText>
        </View>
      )}

      <Animated.View style={[styles.overlayTop, getSpringboardStyle(0)]}>
        <LinearGradient
          colors={
            dark
              ? ['rgba(14,19,26,0.92)', 'rgba(14,19,26,0.5)', 'transparent']
              : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.6)', 'transparent']
          }
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ConnectPortalChrome
          activeTab={activeTab}
          onTabChange={onChangeTab}
          userAvatarUri={currentUser?.profileImage}
          overlay
          onAddPress={activeTab !== 'Places' ? handleAddPress : undefined}
          addAccessibilityLabel={activeTab === 'Go!' ? 'Create event' : 'Create job'}
        />
      </Animated.View>

      {showBottomChips ? (
        <Animated.View
          style={[styles.bottomChipRail, { bottom: chipRailBottom }, getSpringboardStyle(1)]}
        >
          {renderBottomChips()}
        </Animated.View>
      ) : null}

      <Animated.View
        pointerEvents="box-none"
        style={[styles.bottomSearchDock, { bottom: searchRowBottom }, getSpringboardStyle(2)]}
      >
        <ConnectRetractableSearchBar
          key={`connect-map-${activeTab}`}
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
            toMap: false,
            onPress: () => onChangeViewMode('list'),
            accessibilityLabel: 'Switch to list view',
          }}
        />
      </Animated.View>

      {floatingCard ? (
        <View style={[styles.previewRail, { bottom: previewRailBottom }]}>{floatingCard}</View>
      ) : null}

      <ConnectPortalFilterSheet
        visible={filterSheetVisible}
        activeTab={activeTab}
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
          roleTypeOptions:
            serve.roleTypeOptions.length > 0
              ? serve.roleTypeOptions
              : CONNECT_DEFAULT_SERVE_ROLE_OPTIONS,
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x24,
    gap: spacing.x8,
  },
  mapFallbackTitle: {
    ...Typography.body.x2M,
    color: CONNECT_BRAND.gray100,
  },
  mapFallbackBody: {
    ...Typography.body.x1,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  overlayTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 12,
  },
  bottomChipRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 12,
  },
  previewRail: {
    position: 'absolute',
    left: spacing.x16,
    right: spacing.x16,
    zIndex: 13,
  },
  bottomSearchDock: {
    position: 'absolute',
    left: spacing.x16,
    right: spacing.x16,
    zIndex: 14,
  },
  markerTapTarget: {
    width: 64,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MapViewScreen;
