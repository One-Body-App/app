import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import StyledText from '@/components/styled/Text';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ConnectStackParamsList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import {
  formatConnectPortalDateTime,
  trackConnectPortalEventTelemetry,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { CONNECT_PORTAL_LIST_DATA } from './data';
import {
  CONNECT_BRAND,
  ConnectPlaceCard,
  ConnectPlacesFilterSheet,
  ConnectPlacesQuickChips,
  ConnectPortalChrome,
} from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectPortal'>;

function ListViewScreen({ navigation, route }: Props): React.JSX.Element {
  const { colors } = useTheme();
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

  const eventItems = useMemo(
    () =>
      snapshot.publicPublished.map((eventRecord) => ({
        id: eventRecord.id,
        title: eventRecord.title,
        subtitle: `${eventRecord.venueName || eventRecord.address || 'Location TBD'} • ${formatConnectPortalDateTime(eventRecord)}`,
        tags: eventRecord.tags.length > 0 ? eventRecord.tags : ['Event'],
      })),
    [snapshot.publicPublished]
  );

  const serveItems = CONNECT_PORTAL_LIST_DATA.Serve.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.location,
    tags: item.tags,
  }));

  const sectionTitle =
    activeTab === 'Places'
      ? 'Recommended for You'
      : activeTab === 'Go!'
        ? 'Upcoming Events'
        : 'Open Opportunities';

  const onChangeViewMode = (viewMode: 'list' | 'map') => {
    setViewMode(activeTab, viewMode);
    if (viewMode === 'map') {
      navigation.navigate('ConnectMap', { initialTab: activeTab });
    }
  };

  return (
    <View style={styles.container}>
      <ConnectPortalChrome
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchText={searchByTab[activeTab]}
        onSearchChange={(text) => setSearchText(activeTab, text)}
        searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
        viewMode={viewModes[activeTab]}
        onViewModeChange={onChangeViewMode}
        onOpenFilters={() => {
          if (activeTab === 'Places') {
            places.setFilterSheetOpen(true);
          }
        }}
        userAvatarUri={currentUser?.profileImage}
      />

      {activeTab === 'Places' ? (
        <ConnectPlacesQuickChips selectedChip={places.quickChip} onSelect={places.setQuickChip} />
      ) : null}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentBody}
      >
        <View style={styles.sectionHeader}>
          <StyledText style={styles.sectionTitle}>{sectionTitle}</StyledText>
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
          ? eventItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.genericCard, { backgroundColor: colors.card }]}
                onPress={() => {
                  trackConnectPortalEventTelemetry(item.id, 'detail_open', {
                    source: 'connect_list',
                  }).catch(() => {});
                  navigation.navigate('ConnectGoEventView', { eventId: item.id });
                }}
              >
                <MaterialIcons name="event" size={28} color={CONNECT_BRAND.infoBase} />
                <View style={styles.genericCardCopy}>
                  <StyledText style={styles.genericCardTitle}>{item.title}</StyledText>
                  <StyledText style={styles.genericCardSubtitle}>{item.subtitle}</StyledText>
                  <View style={styles.genericTagsRow}>
                    {item.tags.map((tag) => (
                      <View key={`${item.id}-${tag}`} style={styles.genericTag}>
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
                <MaterialIcons name="volunteer-activism" size={28} color={CONNECT_BRAND.infoBase} />
                <View style={styles.genericCardCopy}>
                  <StyledText style={styles.genericCardTitle}>{item.title}</StyledText>
                  <StyledText style={styles.genericCardSubtitle}>{item.subtitle}</StyledText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONNECT_BRAND.backgroundDark,
  },
  content: {
    flex: 1,
  },
  contentBody: {
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x104,
    gap: spacing.x13,
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
