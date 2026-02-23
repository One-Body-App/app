import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchIcon from '@/assets/icons/search.svg';
import StyledText from '@/components/styled/Text';
import StyledTextInput from '@/components/styled/TextInput';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { MAPBOX_PUBLIC_TOKEN } from '@/services/constants';
import { ConnectStackParamsList } from '@/src/navigator/types';
import {
  CONNECT_PORTAL_MAP_DATA,
  type ConnectPortalMapItem,
  type ConnectTab,
  type Coordinate,
} from './data';

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
    // Keep this lazy so app startup doesn't fail before native Mapbox is linked.
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

function MapViewScreen({ navigation }: Props): React.JSX.Element {
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(dark), [dark]);
  const mapbox = useMemo(() => resolveMapboxModule(), []);

  const [activeTab, setActiveTab] = useState<ConnectTab>('Places');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const activeItems = useMemo(() => CONNECT_PORTAL_MAP_DATA[activeTab] ?? [], [activeTab]);

  const filteredItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return activeItems;
    }

    return activeItems.filter(
      (item) =>
        item.title.toLowerCase().includes(normalized) ||
        item.address.toLowerCase().includes(normalized)
    );
  }, [activeItems, searchTerm]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedItemId(null);
      return;
    }

    if (!selectedItemId || !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0],
    [filteredItems, selectedItemId]
  );

  const centerCoordinate: Coordinate = selectedItem?.coordinate ?? DEFAULT_CENTER;
  const handleBackToList = () => {
    if (navigation.canGoBack()) {
      navigation.popToTop();
      return;
    }
    navigation.navigate('ConnectPortal');
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

            {filteredItems.map((item) => {
              const isSelected = item.id === selectedItem?.id;
              const markerContent = (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setSelectedItemId(item.id)}
                  style={[styles.marker, isSelected ? styles.markerActive : null]}
                >
                  <MaterialIcons
                    name={getMarkerIcon(item.type)}
                    size={14}
                    color={isSelected ? '#FFFFFF' : Colors.primary.brand}
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
                  onSelected={() => setSelectedItemId(item.id)}
                >
                  {markerContent}
                </mapbox.PointAnnotation>
              );
            })}
          </mapbox.MapView>
        ) : (
          <View style={styles.mapFallback}>
            <MaterialIcons name="map" size={28} color={Colors.primarySapphire.brand} />
            <StyledText style={styles.mapFallbackTitle}>Map view unavailable</StyledText>
            <StyledText style={styles.mapFallbackBody}>
              Rebuild the app to finish linking Mapbox native modules.
            </StyledText>
          </View>
        )}

        <View style={[styles.floatingTopPanel, { top: insets.top + spacing.x13 }]}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.9}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleBackToList}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={26}
              color={dark ? Colors.primarySapphire[700] : Colors.primary.brand}
            />
          </TouchableOpacity>

          <StyledTextInput
            value={searchTerm}
            placeholder={`Search ${activeTab.toLowerCase()}`}
            onChangeText={setSearchTerm}
            wrapperStyle={styles.searchInput}
            leftIcon={
              <View style={styles.searchIconWrap}>
                <SearchIcon
                  style={{ height: 18, width: 18 }}
                  stroke={dark ? Colors.neutral[500] : Colors.neutral[400]}
                />
              </View>
            }
          />

          <View style={styles.filterRow}>
            {(['Places', 'Go!', 'Serve'] as ConnectTab[]).map((tab) => {
              const isActive = tab === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    setSelectedItemId(null);
                  }}
                  style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
                  activeOpacity={0.9}
                >
                  <StyledText
                    style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}
                  >
                    {tab}
                  </StyledText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedItem ? (
          <View style={styles.floatingBottomCard}>
            <StyledText style={styles.selectedTitle}>{selectedItem.title}</StyledText>
            <StyledText style={styles.selectedSubtitle}>{selectedItem.subtitle}</StyledText>
            <StyledText style={styles.selectedAddress}>{selectedItem.address}</StyledText>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: dark ? '#0D0D0D' : Colors.neutral[700],
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
      backgroundColor: dark ? '#111B20' : '#F6FBFC',
    },
    mapFallbackTitle: {
      ...Typography.body.x2M,
      color: dark ? Colors.primarySapphire[700] : Colors.primary.brand,
    },
    mapFallbackBody: {
      ...Typography.body.x1,
      color: dark ? Colors.neutral[500] : Colors.neutral[300],
      textAlign: 'center',
    },
    marker: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#E7F0F3',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.primarySapphire[500],
    },
    markerActive: {
      backgroundColor: Colors.primarySapphire.brand,
      borderColor: Colors.primarySapphire.brand,
    },
    floatingTopPanel: {
      position: 'absolute',
      left: spacing.x13,
      right: spacing.x13,
      gap: spacing.x10,
      zIndex: 20,
      overflow: 'visible',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: dark ? '#234550' : '#DCE7EB',
      backgroundColor: dark ? 'rgba(17,27,32,0.96)' : 'rgba(255,255,255,0.96)',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    searchInput: {
      marginBottom: 0,
      borderWidth: 1,
      borderColor: dark ? '#234550' : '#DCE7EB',
      backgroundColor: dark ? 'rgba(17,27,32,0.96)' : 'rgba(255,255,255,0.96)',
      borderRadius: borderRadius.large,
    },
    searchIconWrap: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: spacing.x5,
    },
    filterRow: {
      flexDirection: 'row',
      gap: spacing.x8,
      marginTop: spacing.x5,
      overflow: 'visible',
    },
    filterChip: {
      flex: 1,
      minHeight: 42,
      paddingHorizontal: spacing.x10,
      borderRadius: borderRadius.base,
      borderWidth: 1,
      borderColor: dark ? '#254A58' : '#CCDDE3',
      backgroundColor: dark ? 'rgba(17,27,32,0.94)' : 'rgba(243,248,250,0.95)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterChipActive: {
      borderColor: '#12D2D9',
      backgroundColor: '#12D2D9',
    },
    filterChipText: {
      ...Typography.body.x2M,
      color: dark ? Colors.primarySapphire[700] : Colors.primary.brand,
    },
    filterChipTextActive: {
      color: Colors.primary.brand,
      fontWeight: '700',
    },
    floatingBottomCard: {
      position: 'absolute',
      left: spacing.x13,
      right: spacing.x13,
      bottom: spacing.x20,
      borderRadius: borderRadius.large,
      borderWidth: 1,
      borderColor: dark ? '#234550' : '#DCE7EB',
      backgroundColor: dark ? 'rgba(17,27,32,0.96)' : 'rgba(255,255,255,0.97)',
      paddingHorizontal: spacing.x16,
      paddingVertical: spacing.x13,
      gap: spacing.x5,
    },
    selectedTitle: {
      ...Typography.body.x2M,
      color: dark ? Colors.primarySapphire[700] : Colors.primary.brand,
      fontWeight: '700',
    },
    selectedSubtitle: {
      ...Typography.body.x2,
      color: dark ? Colors.neutral[500] : Colors.neutral[300],
    },
    selectedAddress: {
      ...Typography.body.x1,
      color: dark ? Colors.neutral[500] : Colors.neutral[300],
    },
  });

export default MapViewScreen;
