import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { DrawerActions, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import StyledText from '@/components/styled/Text';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MAPBOX_PUBLIC_TOKEN, NO_PROFILE_IMAGE } from '@/services/constants';
import { ConnectStackParamsList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { trackConnectPortalEventTelemetry } from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { CONNECT_PORTAL_MAP_DATA, type ConnectPortalMapItem, type Coordinate } from './data';
import {
  CONNECT_BRAND,
  CONNECT_TABS,
  ConnectPlaceDetailSheet,
  ConnectPlacesFilterSheet,
  ConnectPlacesQuickChips,
} from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectMap'>;

const FALLBACK_MAPBOX_PUBLIC_TOKEN =
  'pk.eyJ1Ijoib25lYm9keWRldiIsImEiOiJjbGJ4a2Z4ZDQwYjkzM3ZtZHFib3Noa21jIn0.focAWV7VQewXQeUykG8LVA';

const mapboxAccessToken = MAPBOX_PUBLIC_TOKEN ?? FALLBACK_MAPBOX_PUBLIC_TOKEN;

type MapboxModule = {
  Camera: React.ComponentType<any>;
  MapView: React.ComponentType<any>;
  PointAnnotation?: React.ComponentType<any>;
  MarkerView?: React.ComponentType<any>;
  StyleURL?: {
    Street?: string;
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

    if (candidate?.setAccessToken) {
      candidate.setAccessToken(mapboxAccessToken);
    }

    return candidate as MapboxModule;
  } catch {
    return null;
  }
}

const DEFAULT_CENTER: Coordinate = [-84.388, 33.749];

function getMarkerIcon(itemType: ConnectPortalMapItem['type']) {
  if (itemType === 'event') return 'event';
  if (itemType === 'job') return 'work';
  return 'location-city';
}

function MapViewScreen({ navigation, route }: Props): React.JSX.Element {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const mapbox = useMemo(() => resolveMapboxModule(), []);
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
  } = useConnectPortalData();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab, setActiveTab]);

  useEffect(() => {
    if (activeTab === 'Go!') {
      refresh();
    }
  }, [activeTab, refresh]);

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
      return snapshot.publicPublished.map((eventRecord) => ({
        id: eventRecord.id,
        title: eventRecord.title,
        subtitle: `${eventRecord.startDate || 'Date TBD'}${eventRecord.startTime ? ` • ${eventRecord.startTime}` : ''}`,
        address: eventRecord.address || eventRecord.venueName || 'Location TBD',
        coordinate: eventRecord.coordinate || DEFAULT_CENTER,
        type: 'event' as const,
      }));
    }

    return CONNECT_PORTAL_MAP_DATA.Serve;
  }, [activeTab, places.visibleRecords, snapshot.publicPublished]);

  useEffect(() => {
    if (activeTab !== 'Places') {
      if (!activeItems.length) {
        setSelectedItemId(null);
        return;
      }

      if (!selectedItemId || !activeItems.some((item) => item.id === selectedItemId)) {
        setSelectedItemId(activeItems[0].id);
      }
    }
  }, [activeItems, activeTab, selectedItemId]);

  const selectedPlace =
    activeTab === 'Places'
      ? places.visibleRecords.find((place) => place.id === places.selectedPlaceId)
      : null;
  const selectedNonPlaceItem =
    activeTab === 'Places' ? null : activeItems.find((item) => item.id === selectedItemId);

  const centerCoordinate: Coordinate =
    activeTab === 'Places'
      ? selectedPlace?.coordinate || places.visibleRecords[0]?.coordinate || DEFAULT_CENTER
      : selectedNonPlaceItem?.coordinate || DEFAULT_CENTER;

  const onChangeViewMode = (viewMode: 'list' | 'map') => {
    setViewMode(activeTab, viewMode);
    if (viewMode === 'list') {
      navigation.navigate('ConnectPortal', { initialTab: activeTab });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {mapbox ? (
          <mapbox.MapView
            style={styles.map}
            styleURL={mapbox.StyleURL?.Street}
            logoEnabled={false}
            attributionEnabled={false}
            scaleBarEnabled={false}
            compassEnabled={false}
            rotateEnabled={false}
          >
            <mapbox.Camera
              zoomLevel={10.3}
              centerCoordinate={centerCoordinate}
              animationDuration={300}
            />

            {activeItems.map((item) => {
              const isSelected =
                activeTab === 'Places'
                  ? item.id === places.selectedPlaceId
                  : item.id === selectedItemId;
              const markerContent = (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    if (activeTab === 'Places') {
                      places.selectPlace(item.id);
                    } else {
                      setSelectedItemId(item.id);
                      if (activeTab === 'Go!') {
                        trackConnectPortalEventTelemetry(item.id, 'detail_open', {
                          source: 'connect_map_marker',
                        }).catch(() => {});
                      }
                    }
                  }}
                  style={[styles.marker, isSelected ? styles.markerActive : null]}
                >
                  <MaterialIcons
                    name={getMarkerIcon(item.type)}
                    size={14}
                    color={isSelected ? CONNECT_BRAND.backgroundDark : CONNECT_BRAND.infoBase}
                  />
                </TouchableOpacity>
              );

              if (mapbox.MarkerView) {
                return (
                  <mapbox.MarkerView
                    key={item.id}
                    id={item.id}
                    coordinate={item.coordinate}
                    anchor={{ x: 0.5, y: 0.5 }}
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
                  onSelected={() => {
                    if (activeTab === 'Places') {
                      places.selectPlace(item.id);
                    } else {
                      setSelectedItemId(item.id);
                    }
                  }}
                >
                  {markerContent}
                </mapbox.PointAnnotation>
              );
            })}
          </mapbox.MapView>
        ) : (
          <View style={[styles.mapFallback, { backgroundColor: colors.card }]}>
            <MaterialIcons name="map" size={28} color={CONNECT_BRAND.infoBase} />
            <StyledText style={styles.mapFallbackTitle}>Map view unavailable</StyledText>
            <StyledText style={styles.mapFallbackBody}>
              Rebuild the app to finish linking Mapbox native modules.
            </StyledText>
          </View>
        )}

        <View style={[styles.overlayTop, { paddingTop: insets.top + spacing.x10 }]}>
          {/* Floating header: avatar + title, no background */}
          <View style={styles.floatingHeaderRow}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            >
              <Image
                source={{ uri: currentUser?.profileImage || NO_PROFILE_IMAGE }}
                style={styles.floatingAvatar}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {Platform.OS === 'ios' ? (
              <View style={styles.floatingTitleCenter} pointerEvents="none">
                <StyledText style={styles.floatingTitleText}>Connect</StyledText>
              </View>
            ) : (
              <StyledText style={[styles.floatingTitleText, styles.floatingTitleAndroid]}>
                Connect
              </StyledText>
            )}
          </View>

          {/* Floating tabs: no background */}
          <View style={styles.floatingTabsRow}>
            {CONNECT_TABS.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    setSelectedItemId(null);
                  }}
                  activeOpacity={0.9}
                  style={styles.floatingTabButton}
                >
                  <StyledText
                    style={[styles.floatingTabText, isActive ? styles.floatingTabTextActive : null]}
                  >
                    {tab}
                  </StyledText>
                  <View
                    style={[
                      styles.floatingTabIndicator,
                      isActive ? styles.floatingTabIndicatorActive : null,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Floating search + filter bar */}
          <View style={styles.floatingSearchRow}>
            <MaterialIcons name="search" size={20} color={CONNECT_BRAND.infoBase} />
            <TextInput
              value={searchByTab[activeTab]}
              onChangeText={(text) => setSearchText(activeTab, text)}
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              placeholderTextColor={CONNECT_BRAND.gray400}
              style={styles.floatingSearchInput}
            />
            <TouchableOpacity
              onPress={() => {
                if (activeTab === 'Places') {
                  places.setFilterSheetOpen(true);
                }
              }}
              style={styles.floatingActionIcon}
            >
              <MaterialCommunityIcons name="tune-variant" size={20} color={CONNECT_BRAND.gray100} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onChangeViewMode('list')}
              style={styles.floatingActionIcon}
            >
              <MaterialIcons name="view-list" size={20} color={CONNECT_BRAND.gray100} />
            </TouchableOpacity>
          </View>

          {activeTab === 'Places' ? (
            <ConnectPlacesQuickChips
              selectedChip={places.quickChip}
              onSelect={places.setQuickChip}
            />
          ) : null}
        </View>

        {activeTab === 'Places' && selectedPlace ? (
          <View style={[styles.bottomSheetWrap, { bottom: insets.bottom + spacing.x72 }]}>
            <ConnectPlaceDetailSheet
              place={selectedPlace}
              isFollowing={places.isFollowing(selectedPlace.id)}
              onToggleFollow={() => places.toggleFollow(selectedPlace.id)}
            />
          </View>
        ) : null}

        {activeTab !== 'Places' && selectedNonPlaceItem ? (
          <TouchableOpacity
            style={[styles.floatingCard, { bottom: insets.bottom + spacing.x72 }]}
            activeOpacity={activeTab === 'Go!' ? 0.88 : 1}
            disabled={activeTab !== 'Go!'}
            onPress={() => {
              if (activeTab !== 'Go!') {
                return;
              }
              trackConnectPortalEventTelemetry(selectedNonPlaceItem.id, 'detail_open', {
                source: 'connect_map_card',
              }).catch(() => {});
              navigation.navigate('ConnectGoEventView', { eventId: selectedNonPlaceItem.id });
            }}
          >
            <StyledText style={styles.floatingTitle}>{selectedNonPlaceItem.title}</StyledText>
            <StyledText style={styles.floatingSubtitle}>{selectedNonPlaceItem.subtitle}</StyledText>
            <StyledText style={styles.floatingAddress}>{selectedNonPlaceItem.address}</StyledText>
          </TouchableOpacity>
        ) : null}
      </View>

      <ConnectPlacesFilterSheet
        visible={places.filterSheetOpen}
        filters={places.filters}
        organizationTypes={places.organizationTypes}
        churchTypes={places.churchTypes}
        sortOptions={places.sortOptions}
        onClose={() => places.setFilterSheetOpen(false)}
        onApply={places.setFilters}
        onReset={places.resetFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CONNECT_BRAND.backgroundDark,
  },
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
    gap: spacing.x8,
  },
  floatingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    height: 48,
  },
  floatingAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: CONNECT_BRAND.infoBase,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  floatingTitleCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingTitleText: {
    ...Typography.header.h3,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  floatingTitleAndroid: {
    marginLeft: spacing.x13,
  },
  floatingTabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.x24,
    paddingHorizontal: spacing.x16,
  },
  floatingTabButton: {
    alignItems: 'center',
    gap: spacing.x5,
  },
  floatingTabText: {
    ...Typography.body.x2M,
    color: 'rgba(255,255,255,0.65)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  floatingTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  floatingTabIndicator: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  floatingTabIndicatorActive: {
    backgroundColor: CONNECT_BRAND.infoBase,
  },
  floatingSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.x16,
    paddingHorizontal: spacing.x13,
    height: 48,
    gap: spacing.x10,
    backgroundColor: 'rgba(3,47,60,0.88)',
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: 'rgba(79,109,119,0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  floatingSearchInput: {
    flex: 1,
    color: CONNECT_BRAND.gray100,
    fontSize: 16,
  },
  floatingActionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(3,47,60,0.9)',
    borderWidth: 1,
    borderColor: CONNECT_BRAND.primaryBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerActive: {
    backgroundColor: CONNECT_BRAND.infoBase,
    borderColor: CONNECT_BRAND.infoBase,
  },
  bottomSheetWrap: {
    position: 'absolute',
    left: spacing.x16,
    right: spacing.x16,
  },
  floatingCard: {
    position: 'absolute',
    left: spacing.x16,
    right: spacing.x16,
    borderRadius: borderRadius.large,
    padding: spacing.x16,
    backgroundColor: 'rgba(3,47,60,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(79,109,119,0.7)',
    gap: spacing.x5,
  },
  floatingTitle: {
    ...Typography.body.x2M,
    color: CONNECT_BRAND.gray100,
    fontWeight: '700',
  },
  floatingSubtitle: {
    ...Typography.body.x1,
    color: CONNECT_BRAND.infoBase,
  },
  floatingAddress: {
    ...Typography.body.x1,
    color: CONNECT_BRAND.gray400,
  },
});

export default MapViewScreen;
