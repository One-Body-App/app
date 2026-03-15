import React from 'react';
import { Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Notification } from 'iconsax-react-native';
import StyledText from '@/components/styled/Text';
import CustomModal from '@/components/CustomModal';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import { Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import type { ConnectTab } from './data';
import type {
  ConnectPlaceFilterOption,
  ConnectPlaceFilters,
  ConnectPlaceRecord,
  ConnectPlacesQuickChip,
  ConnectViewMode,
} from '@/src/services/connectPortal';

export const CONNECT_BRAND = {
  backgroundBase: '#3c4b64',
  backgroundDark: '#032f3c',
  surface: '#4f6d77',
  surfaceStrong: '#355963',
  primaryBase: '#41899f',
  primaryDark: '#126b87',
  infoBase: '#41dbe1',
  infoDark: '#12d2d9',
  gray100: '#e6eaec',
  gray400: '#9aacb1',
};

export const CONNECT_TABS: ConnectTab[] = ['Places', 'Go!', 'Serve'];
export const CONNECT_PLACE_QUICK_CHIPS: ConnectPlacesQuickChip[] = [
  'Nearby',
  'Non-Profits',
  'Churches',
  'Mega-Church',
];

type ChromeProps = {
  activeTab: ConnectTab;
  onTabChange: (tab: ConnectTab) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  viewMode: ConnectViewMode;
  onViewModeChange: (viewMode: ConnectViewMode) => void;
  onOpenFilters: () => void;
  userAvatarUri?: string;
  overlay?: boolean;
};

export function ConnectPortalChrome({
  activeTab,
  onTabChange,
  searchText,
  onSearchChange,
  searchPlaceholder,
  viewMode,
  onViewModeChange,
  onOpenFilters,
  userAvatarUri,
  overlay,
}: ChromeProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View
      style={[
        styles.chromeWrap,
        overlay ? styles.chromeWrapOverlay : null,
        { paddingTop: insets.top + spacing.x10 },
      ]}
    >
      {overlay ? (
        <>
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={18}
            reducedTransparencyFallbackColor={CONNECT_BRAND.backgroundDark}
          />
          <View style={styles.chromeOverlayScrim} pointerEvents="none" />
        </>
      ) : null}

      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
        >
          <Image
            source={{ uri: userAvatarUri || NO_PROFILE_IMAGE }}
            style={styles.userAvatar}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <StyledText style={styles.titleText}>Connect</StyledText>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate('MainRoot', {
              screen: 'Main',
              params: { screen: 'HomeTab', params: { screen: 'Notifications' } },
            })
          }
          style={styles.iconButton}
        >
          <Notification size={22} color={CONNECT_BRAND.gray100} variant="Linear" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {CONNECT_TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabChange(tab)}
              activeOpacity={0.9}
              style={styles.tabButton}
            >
              <StyledText style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                {tab}
              </StyledText>
              <View style={[styles.tabIndicator, isActive ? styles.tabIndicatorActive : null]} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchActionRow}>
        <View style={styles.searchInputWrap}>
          <MaterialIcons name="search" size={22} color={CONNECT_BRAND.infoBase} />
          <TextInput
            value={searchText}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder || 'Search places...'}
            placeholderTextColor={CONNECT_BRAND.gray400}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.searchActions}>
          <TouchableOpacity onPress={onOpenFilters} style={styles.actionIconButton}>
            <MaterialCommunityIcons name="tune-variant" size={20} color={CONNECT_BRAND.gray100} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onViewModeChange('list')}
            style={styles.actionIconButton}
          >
            <MaterialIcons
              name="view-list"
              size={20}
              color={viewMode === 'list' ? CONNECT_BRAND.primaryBase : CONNECT_BRAND.gray400}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onViewModeChange('map')} style={styles.actionIconButton}>
            <MaterialIcons
              name="map"
              size={20}
              color={viewMode === 'map' ? CONNECT_BRAND.primaryBase : CONNECT_BRAND.gray400}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

type QuickChipProps = {
  selectedChip: ConnectPlacesQuickChip;
  onSelect: (chip: ConnectPlacesQuickChip) => void;
};

export function ConnectPlacesQuickChips({ selectedChip, onSelect }: QuickChipProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickChipRow}
    >
      {CONNECT_PLACE_QUICK_CHIPS.map((chip) => {
        const isActive = chip === selectedChip;
        return (
          <TouchableOpacity
            key={chip}
            activeOpacity={0.9}
            onPress={() => onSelect(chip)}
            style={[styles.quickChip, isActive ? styles.quickChipActive : null]}
          >
            <StyledText
              style={[styles.quickChipText, isActive ? styles.quickChipTextActive : null]}
            >
              {chip}
            </StyledText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

type FilterSheetProps = {
  visible: boolean;
  filters: ConnectPlaceFilters;
  organizationTypes: ConnectPlaceFilterOption[];
  churchTypes: ConnectPlaceFilterOption[];
  sortOptions: ConnectPlaceFilterOption[];
  onClose: () => void;
  onApply: (updates: Partial<ConnectPlaceFilters>) => void;
  onReset: () => void;
};

const ORGANIZATION_SIZE_OPTIONS: ConnectPlaceFilterOption[] = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'Mega', value: 'mega' },
];

export function ConnectPlacesFilterSheet({
  visible,
  filters,
  organizationTypes,
  churchTypes,
  sortOptions,
  onClose,
  onApply,
  onReset,
}: FilterSheetProps) {
  const renderOptionGroup = (
    title: string,
    options: ConnectPlaceFilterOption[],
    currentValue: string | undefined,
    onChange: (value: string) => void
  ) => (
    <View style={styles.sheetSection}>
      <StyledText style={styles.sheetSectionTitle}>{title}</StyledText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sheetOptionRow}
      >
        {options.map((option) => {
          const isActive = currentValue === option.value;
          return (
            <TouchableOpacity
              key={`${title}-${option.value}`}
              onPress={() => onChange(isActive ? '' : option.value)}
              style={[styles.sheetChip, isActive ? styles.sheetChipActive : null]}
            >
              <StyledText
                style={[styles.sheetChipText, isActive ? styles.sheetChipTextActive : null]}
              >
                {option.label}
              </StyledText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <CustomModal modalVisible={visible} onclose={onClose} style={styles.filterSheetModal}>
      <View style={styles.filterSheetContent}>
        <View style={styles.sheetHeader}>
          <StyledText style={styles.sheetTitle}>Places Filters</StyledText>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={CONNECT_BRAND.gray100} />
          </TouchableOpacity>
        </View>

        {renderOptionGroup('Sort', sortOptions, filters.sort, (value) =>
          onApply({ sort: (value || 'nearby') as ConnectPlaceFilters['sort'] })
        )}

        {renderOptionGroup(
          'Organization Type',
          organizationTypes.slice(0, 10),
          filters.organizationTypeIds[0],
          (value) => onApply({ organizationTypeIds: value ? [value] : [] })
        )}

        {renderOptionGroup('Denomination', churchTypes.slice(0, 10), filters.churchType, (value) =>
          onApply({ churchType: value })
        )}

        {renderOptionGroup('Size', ORGANIZATION_SIZE_OPTIONS, filters.organizationSize, (value) =>
          onApply({ organizationSize: value as ConnectPlaceFilters['organizationSize'] })
        )}

        <View style={styles.sheetSection}>
          <StyledText style={styles.sheetSectionTitle}>Location</StyledText>
          <View style={styles.sheetTextInputWrap}>
            <MaterialIcons name="place" size={18} color={CONNECT_BRAND.gray400} />
            <TextInput
              value={filters.locationAddress}
              onChangeText={(value) => onApply({ locationAddress: value })}
              placeholder="Override location"
              placeholderTextColor={CONNECT_BRAND.gray400}
              style={styles.sheetTextInput}
            />
          </View>
        </View>

        <View style={styles.sheetFooter}>
          <TouchableOpacity onPress={onReset} style={styles.resetButton}>
            <StyledText style={styles.resetButtonText}>Reset</StyledText>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <StyledText style={styles.doneButtonText}>Done</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
}

type PlaceCardProps = {
  place: ConnectPlaceRecord;
  onPress?: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  compact?: boolean;
};

export function ConnectPlaceCard({
  place,
  onPress,
  isFollowing,
  onToggleFollow,
  compact,
}: PlaceCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.placeCard, compact ? styles.placeCardCompact : null]}
    >
      <View style={styles.placeCardHeader}>
        <View style={styles.placeCardIdentity}>
          <Image
            source={{ uri: place.avatarUri || NO_PROFILE_IMAGE }}
            style={styles.placeAvatar}
            resizeMode="cover"
          />
          <View style={styles.placeTitleWrap}>
            <StyledText style={styles.placeTitle}>{place.title}</StyledText>
            <StyledText style={styles.placeSubtitle}>
              {[place.organizationTypeLabel, place.churchTypeLabel].filter(Boolean).join(' • ') ||
                'Organization'}
            </StyledText>
          </View>
        </View>
        <TouchableOpacity onPress={onToggleFollow} style={styles.followButton}>
          <StyledText style={styles.followButtonText}>
            {isFollowing ? 'Following' : 'Follow'}
          </StyledText>
        </TouchableOpacity>
      </View>

      <StyledText style={styles.placeAddress}>
        {place.distanceLabel ? `${place.distanceLabel} • ${place.address}` : place.address}
      </StyledText>

      <View style={styles.placeTagsRow}>
        {place.metadataTags.map((tag) => (
          <View key={`${place.id}-${tag}`} style={styles.placeTag}>
            <StyledText style={styles.placeTagText}>{tag}</StyledText>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

type DetailSheetProps = {
  place: ConnectPlaceRecord;
  isFollowing: boolean;
  onToggleFollow: () => void;
};

export function ConnectPlaceDetailSheet({ place, isFollowing, onToggleFollow }: DetailSheetProps) {
  return (
    <View style={styles.detailSheet}>
      <View style={styles.detailHandle} />
      <ConnectPlaceCard
        place={place}
        isFollowing={isFollowing}
        onToggleFollow={onToggleFollow}
        compact
      />
      <View style={styles.detailMetaRow}>
        <View style={styles.detailMetaItem}>
          <StyledText style={styles.detailMetaLabel}>Distance</StyledText>
          <StyledText style={styles.detailMetaValue}>{place.distanceLabel || 'N/A'}</StyledText>
        </View>
        <View style={styles.detailMetaItem}>
          <StyledText style={styles.detailMetaLabel}>Status</StyledText>
          <StyledText style={styles.detailMetaValue}>
            {place.isOpen ? 'Open now' : 'Active'}
          </StyledText>
        </View>
        <View style={styles.detailMetaItem}>
          <StyledText style={styles.detailMetaLabel}>Followers</StyledText>
          <StyledText style={styles.detailMetaValue}>{String(place.followerCount || 0)}</StyledText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chromeWrap: {
    backgroundColor: CONNECT_BRAND.backgroundDark,
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x16,
    gap: spacing.x16,
  },
  chromeWrapOverlay: {
    backgroundColor: 'transparent',
  },
  chromeOverlayScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3,47,60,0.86)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,109,119,0.28)',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    ...Typography.header.h3,
    color: CONNECT_BRAND.gray100,
    fontWeight: '700',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: CONNECT_BRAND.infoBase,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.x24,
  },
  tabButton: {
    alignItems: 'center',
    gap: spacing.x8,
  },
  tabText: {
    ...Typography.body.x2M,
    color: CONNECT_BRAND.gray400,
  },
  tabTextActive: {
    color: CONNECT_BRAND.infoBase,
    fontWeight: '700',
  },
  tabIndicator: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: CONNECT_BRAND.infoBase,
  },
  searchActionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.x10,
  },
  searchInputWrap: {
    flex: 0.7,
    minHeight: 60,
    borderRadius: borderRadius.large,
    backgroundColor: 'rgba(3,47,60,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(79,109,119,0.66)',
    paddingHorizontal: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
  },
  searchInput: {
    flex: 1,
    color: CONNECT_BRAND.gray100,
    fontSize: 18,
  },
  searchActions: {
    flex: 0.3,
    minHeight: 60,
    borderRadius: borderRadius.large,
    backgroundColor: 'rgba(3,47,60,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(79,109,119,0.66)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  actionIconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipRow: {
    gap: spacing.x10,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x13,
  },
  quickChip: {
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x10,
    borderRadius: borderRadius.button,
    backgroundColor: CONNECT_BRAND.surface,
  },
  quickChipActive: {
    backgroundColor: CONNECT_BRAND.primaryBase,
  },
  quickChipText: {
    ...Typography.body.x2M,
    color: CONNECT_BRAND.gray100,
  },
  quickChipTextActive: {
    color: CONNECT_BRAND.backgroundDark,
    fontWeight: '700',
  },
  filterSheetModal: {
    minHeight: '55%',
    backgroundColor: CONNECT_BRAND.backgroundDark,
  },
  filterSheetContent: {
    flex: 1,
    backgroundColor: CONNECT_BRAND.backgroundDark,
    padding: spacing.x20,
    gap: spacing.x16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    ...Typography.header.h3,
    color: CONNECT_BRAND.gray100,
  },
  sheetSection: {
    gap: spacing.x10,
  },
  sheetSectionTitle: {
    ...Typography.body.x2M,
    color: CONNECT_BRAND.gray100,
  },
  sheetOptionRow: {
    gap: spacing.x10,
  },
  sheetChip: {
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x10,
    borderRadius: borderRadius.button,
    backgroundColor: 'rgba(79,109,119,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(79,109,119,0.6)',
  },
  sheetChipActive: {
    backgroundColor: CONNECT_BRAND.primaryBase,
    borderColor: CONNECT_BRAND.primaryBase,
  },
  sheetChipText: {
    color: CONNECT_BRAND.gray100,
  },
  sheetChipTextActive: {
    color: CONNECT_BRAND.backgroundDark,
    fontWeight: '700',
  },
  sheetTextInputWrap: {
    minHeight: 50,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(79,109,119,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(79,109,119,0.6)',
    paddingHorizontal: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
  },
  sheetTextInput: {
    flex: 1,
    color: CONNECT_BRAND.gray100,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.x10,
  },
  resetButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: CONNECT_BRAND.infoBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: CONNECT_BRAND.infoBase,
    fontWeight: '700',
  },
  doneButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.button,
    backgroundColor: CONNECT_BRAND.infoDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: CONNECT_BRAND.backgroundDark,
    fontWeight: '700',
  },
  placeCard: {
    borderRadius: borderRadius.large,
    backgroundColor: CONNECT_BRAND.surfaceStrong,
    padding: spacing.x16,
    gap: spacing.x10,
  },
  placeCardCompact: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: spacing.x10,
  },
  placeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.x10,
  },
  placeCardIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
  },
  placeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CONNECT_BRAND.surface,
  },
  placeTitleWrap: {
    flex: 1,
    gap: spacing.x5,
  },
  placeTitle: {
    ...Typography.body.x2M,
    color: CONNECT_BRAND.gray100,
    fontWeight: '700',
  },
  placeSubtitle: {
    ...Typography.body.x1,
    color: CONNECT_BRAND.gray400,
  },
  followButton: {
    minWidth: 88,
    minHeight: 36,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: CONNECT_BRAND.infoBase,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x13,
  },
  followButtonText: {
    color: CONNECT_BRAND.infoBase,
    fontWeight: '700',
  },
  placeAddress: {
    ...Typography.body.x1,
    color: CONNECT_BRAND.gray100,
  },
  placeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.x8,
  },
  placeTag: {
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x5,
    borderRadius: borderRadius.button,
    backgroundColor: '#71a6b7',
  },
  placeTagText: {
    color: CONNECT_BRAND.backgroundDark,
    fontSize: 11,
    fontWeight: '700',
  },
  detailSheet: {
    height: '24%',
    minHeight: 210,
    borderTopLeftRadius: borderRadius.card,
    borderTopRightRadius: borderRadius.card,
    backgroundColor: 'rgba(3,47,60,0.96)',
    paddingHorizontal: spacing.x20,
    paddingTop: spacing.x10,
    paddingBottom: spacing.x16,
    gap: spacing.x10,
    borderWidth: 1,
    borderColor: 'rgba(79,109,119,0.7)',
  },
  detailHandle: {
    width: 52,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: 'rgba(230,234,236,0.4)',
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.x10,
  },
  detailMetaItem: {
    flex: 1,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(79,109,119,0.22)',
    padding: spacing.x10,
    gap: spacing.x5,
  },
  detailMetaLabel: {
    color: CONNECT_BRAND.gray400,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  detailMetaValue: {
    color: CONNECT_BRAND.gray100,
    fontWeight: '700',
  },
});
