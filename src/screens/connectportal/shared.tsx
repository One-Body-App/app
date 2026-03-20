import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { DrawerActions, useNavigation, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import NetworkPinIcon from '@/assets/svg/Network-Pin--Streamline-Ultimate.svg';
import FilterSortIcon from '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg';
import StyledText from '@/components/styled/Text';
import CustomModal from '@/components/CustomModal';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import { Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import type { ConnectTab } from './data';
import type {
  ConnectGoFilters,
  ConnectGoQuickChip,
  ConnectPlaceFilterOption,
  ConnectPlaceFilters,
  ConnectPlaceRecord,
  ConnectPlacesQuickChip,
  ConnectQuickChip,
  ConnectServeFilters,
  ConnectServeQuickChip,
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

export const CONNECT_TABS: ConnectTab[] = ['Go!', 'Serve', 'Places'];
export const CONNECT_PLACE_QUICK_CHIPS: ConnectPlacesQuickChip[] = [
  'Nearby',
  'Non-Profits',
  'Churches',
  'Mega-Church',
];
export const CONNECT_GO_QUICK_CHIPS: ConnectGoQuickChip[] = [
  'Upcoming',
  'Online',
  'In Person',
  'Live',
];
export const CONNECT_SERVE_QUICK_CHIPS: ConnectServeQuickChip[] = [
  'Hiring',
  'Part-time',
  'Full-time',
  'Serve',
];
export const CONNECT_BOTTOM_NAV_BASE_OFFSET = spacing.x88;
export const CONNECT_BOTTOM_SEARCH_ROW_HEIGHT = 64;
export const CONNECT_BOTTOM_CHIP_RAIL_HEIGHT = 44;
export const CONNECT_BOTTOM_STACK_GAP = spacing.x8;
export const CONNECT_BOTTOM_SEARCH_DOCK_BOTTOM_OFFSET = CONNECT_BOTTOM_NAV_BASE_OFFSET;
export const CONNECT_BOTTOM_SEARCH_DOCK_MAX_HEIGHT = CONNECT_BOTTOM_SEARCH_ROW_HEIGHT;
export const CONNECT_BOTTOM_SEARCH_DOCK_STACK_GAP = CONNECT_BOTTOM_STACK_GAP;

type ChromeProps = {
  activeTab: ConnectTab;
  onTabChange: (tab: ConnectTab) => void;
  userAvatarUri?: string;
  overlay?: boolean;
  headerActionIconName?: ComponentProps<typeof MaterialIcons>['name'];
  onHeaderActionPress?: () => void;
  headerActionAccessibilityLabel?: string;
};

type MapSearchRowProps = {
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  onSwitchToList: () => void;
  onOpenSecondaryAction: () => void;
  secondaryIconName?: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

type MapAvatarButtonProps = {
  userAvatarUri?: string;
};

type RetractableSearchBarProps = {
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  onOpenFilters?: () => void;
  onAddPress?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
};

type MapTabRowProps = {
  activeTab: ConnectTab;
  onTabChange: (tab: ConnectTab) => void;
};

type ConnectGlassTabBarProps = {
  activeTab: ConnectTab;
  onTabChange: (tab: ConnectTab) => void;
};

type QuickChipProps<T extends ConnectQuickChip = ConnectQuickChip> = {
  selectedChip: T;
  onSelect: (chip: T) => void;
  chips?: T[];
  variant?: 'default' | 'bottomOverlay';
};

type ConnectPortalFilterSheetProps = {
  visible: boolean;
  activeTab: ConnectTab;
  onClose: () => void;
  places: {
    filters: ConnectPlaceFilters;
    organizationTypes: ConnectPlaceFilterOption[];
    churchTypes: ConnectPlaceFilterOption[];
    sortOptions: ConnectPlaceFilterOption[];
    onApply: (updates: Partial<ConnectPlaceFilters>) => void;
    onReset: () => void;
  };
  go: {
    filters: ConnectGoFilters;
    sortOptions: ConnectPlaceFilterOption[];
    eventTypeOptions: ConnectPlaceFilterOption[];
    categoryOptions: ConnectPlaceFilterOption[];
    modeOptions: ConnectPlaceFilterOption[];
    onApply: (updates: Partial<ConnectGoFilters>) => void;
    onReset: () => void;
  };
  serve: {
    filters: ConnectServeFilters;
    sortOptions: ConnectPlaceFilterOption[];
    roleTypeOptions: ConnectPlaceFilterOption[];
    tagOptions: ConnectPlaceFilterOption[];
    onApply: (updates: Partial<ConnectServeFilters>) => void;
    onReset: () => void;
  };
};

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

type PlaceCardProps = {
  place: ConnectPlaceRecord;
  onPress?: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  compact?: boolean;
};

export type ConnectMapDetailStat = {
  label: string;
  value: string;
};

type ConnectMapDetailPanelProps = {
  title: string;
  subtitle: string;
  address: string;
  tags: string[];
  stats: ConnectMapDetailStat[];
  imageUri?: string;
  fallbackIcon?: ComponentProps<typeof MaterialIcons>['name'];
  actionLabel?: string;
  onActionPress?: () => void;
  leadingAccessory?: ReactNode;
};

type DetailSheetProps = {
  place: ConnectPlaceRecord;
  isFollowing: boolean;
  onToggleFollow: () => void;
};

type ConnectMapFloatingCardAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

type ConnectMapFloatingCardProps = {
  eyebrow: string;
  title: string;
  meta: string;
  supportingCopy?: string;
  imageUri?: string;
  fallbackIcon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  trailingIconName?: ComponentProps<typeof MaterialIcons>['name'];
  primaryAction?: ConnectMapFloatingCardAction;
  secondaryAction?: ConnectMapFloatingCardAction;
  onDismiss?: () => void;
};

type ConnectMapMarkerProps = {
  iconName: ComponentProps<typeof MaterialCommunityIcons>['name'];
  active?: boolean;
};

const ORGANIZATION_SIZE_OPTIONS: ConnectPlaceFilterOption[] = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'Mega', value: 'mega' },
];

export function useConnectPalette() {
  const { dark, colors } = useTheme();

  return {
    isDark: dark,
    screenBackground: colors.background,
    overlayBackground: dark ? 'rgba(13,13,13,0.82)' : 'rgba(247,251,252,0.92)',
    overlaySubtle: dark ? 'rgba(18,18,18,0.7)' : 'rgba(255,255,255,0.88)',
    overlayStrong: dark ? 'rgba(18,18,18,0.94)' : 'rgba(255,255,255,0.96)',
    overlayScrim: dark ? 'rgba(13,13,13,0.82)' : 'rgba(230,234,236,0.82)',
    card: colors.card,
    cardMuted: dark ? '#181a1c' : '#ebf3f6',
    chip: dark ? 'rgba(230,234,236,0.16)' : '#d8e5ea',
    chipOverlay: dark ? 'rgba(18,18,18,0.72)' : 'rgba(220,229,233,0.94)',
    chipActive: dark ? CONNECT_BRAND.primaryBase : '#7eaab8',
    pill: dark ? 'rgba(65,137,159,0.26)' : 'rgba(65,137,159,0.18)',
    liquidShellOuter: dark ? 'rgba(6,11,17,0.22)' : 'rgba(224,236,241,0.58)',
    liquidShell: dark ? 'rgba(10,15,21,0.58)' : 'rgba(239,246,248,0.9)',
    liquidBorder: dark ? 'rgba(230,234,236,0.14)' : 'rgba(184,207,215,0.88)',
    liquidInnerBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.76)',
    liquidShadow: dark ? '#000000' : '#032f3c',
    liquidShadowOpacity: dark ? 0.24 : 0.11,
    liquidTopHighlightStart: dark ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.72)',
    liquidTopHighlightEnd: dark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0)',
    liquidBottomCausticStart: dark ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0)',
    liquidBottomCausticEnd: dark ? 'rgba(150,197,212,0.08)' : 'rgba(165,197,208,0.16)',
    liquidShellTint: dark ? 'rgba(128,170,185,0.04)' : 'rgba(210,226,232,0.11)',
    liquidPillFill: dark ? 'rgba(122,144,156,0.34)' : 'rgba(255,255,255,0.92)',
    liquidPillToneStart: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.46)',
    liquidPillToneEnd: dark ? 'rgba(150,192,205,0.05)' : 'rgba(204,222,229,0.22)',
    liquidPillBorder: dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.96)',
    liquidPillShadow: dark ? '#000000' : '#032f3c',
    liquidPillShadowOpacity: dark ? 0.18 : 0.1,
    liquidPillHighlightStart: dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.96)',
    liquidPillHighlightEnd: dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.16)',
    border: dark ? 'rgba(255,255,255,0.1)' : 'rgba(3,47,60,0.12)',
    borderStrong: dark ? 'rgba(230,234,236,0.14)' : 'rgba(3,47,60,0.1)',
    divider: dark ? 'rgba(230,234,236,0.15)' : 'rgba(3,47,60,0.12)',
    iconBg: dark ? 'rgba(255,255,255,0.08)' : 'rgba(3,47,60,0.08)',
    textPrimary: dark ? CONNECT_BRAND.gray100 : '#032f3c',
    textSecondary: dark ? CONNECT_BRAND.gray400 : '#4f6d77',
    textMuted: dark ? 'rgba(230,234,236,0.72)' : 'rgba(3,47,60,0.62)',
    activeText: dark ? CONNECT_BRAND.infoBase : CONNECT_BRAND.primaryDark,
    inputBg: dark ? 'rgba(14,19,26,0.72)' : 'rgba(255,255,255,0.9)',
    inputPlaceholder: dark ? CONNECT_BRAND.gray400 : '#68828a',
    activeChipText: '#032f3c',
    tagBg: dark ? '#71a6b7' : '#d6e7ec',
    statBg: dark ? 'rgba(79,109,119,0.22)' : 'rgba(65,137,159,0.1)',
    sheetBackground: colors.card,
    doneButtonText: dark ? CONNECT_BRAND.backgroundDark : '#032f3c',
    glassFallback: dark ? 'rgba(14,19,26,0.9)' : 'rgba(248,251,252,0.96)',
    mapSearchBg: dark ? 'rgba(18,18,18,0.94)' : 'rgba(245,250,251,0.95)',
    mapSearchBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(92,132,146,0.18)',
    mapSearchDivider: dark ? 'rgba(255,255,255,0.1)' : 'rgba(112,145,155,0.18)',
    mapSearchIcon: dark ? CONNECT_BRAND.infoBase : CONNECT_BRAND.primaryDark,
    mapSearchText: dark ? 'rgba(230,234,236,0.58)' : 'rgba(3,47,60,0.54)',
    mapActionBg: dark ? 'rgba(24,24,24,0.94)' : 'rgba(232,241,244,0.92)',
    mapActionBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(92,132,146,0.14)',
    chipGlassBg: dark ? 'rgba(20,20,20,0.92)' : 'rgba(239,246,248,0.94)',
    chipGlassBorder: dark ? 'rgba(255,255,255,0.12)' : 'rgba(104,140,152,0.14)',
    chipGlassActive: dark ? CONNECT_BRAND.infoBase : '#88b8c4',
    chipGlassText: dark ? 'rgba(230,234,236,0.92)' : '#0a4356',
    chipGlassMutedText: dark ? 'rgba(230,234,236,0.86)' : 'rgba(10,67,86,0.82)',
    markerBg: dark ? '#1f87aa' : '#1d8fb4',
    markerBorder: dark ? 'rgba(84,206,214,0.46)' : 'rgba(18,107,135,0.28)',
    markerIcon: '#f7fbfc',
    markerActiveBg: dark ? CONNECT_BRAND.infoBase : '#34d5df',
    markerActiveBorder: dark ? 'rgba(3,47,60,0.58)' : 'rgba(3,47,60,0.34)',
    markerActiveIcon: '#032f3c',
    markerShadow: dark ? 'rgba(0,0,0,0.38)' : 'rgba(3,47,60,0.18)',
    mapPreviewBg: dark ? 'rgba(18,18,18,0.96)' : 'rgba(248,251,252,0.97)',
    mapPreviewBorder: dark ? 'rgba(255,255,255,0.12)' : 'rgba(91,130,142,0.16)',
    mapPreviewEyebrow: dark ? CONNECT_BRAND.infoBase : '#10aebd',
    mapPreviewMeta: dark ? 'rgba(230,234,236,0.66)' : 'rgba(3,47,60,0.62)',
    mapPreviewTitle: dark ? '#ffffff' : '#032f3c',
    mapPreviewSupporting: dark ? 'rgba(230,234,236,0.74)' : 'rgba(3,47,60,0.7)',
    mapPreviewPrimaryBg: dark ? CONNECT_BRAND.infoBase : '#32d2de',
    mapPreviewPrimaryText: '#032f3c',
    mapPreviewSecondaryBorder: dark ? 'rgba(112,145,155,0.42)' : 'rgba(92,132,146,0.28)',
    mapPreviewSecondaryText: dark ? '#ffffff' : '#0a4356',
    mapPreviewDismissBg: dark ? 'rgba(255,255,255,0.08)' : 'rgba(3,47,60,0.06)',
    sheetBg: dark ? 'rgba(16,22,30,0.97)' : colors.card,
    sheetBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(3,47,60,0.08)',
    sheetHandleColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
  };
}

export function useConnectKeyboardMetrics() {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const updateKeyboardHeight = (event: {
      endCoordinates?: {
        height?: number;
      };
    }) => {
      const reportedHeight = event.endCoordinates?.height ?? 0;
      const visibleHeight = Math.max(0, reportedHeight);
      setKeyboardHeight(visibleHeight);
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const frameEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidChangeFrame';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, updateKeyboardHeight);
    const onFrameChange = Keyboard.addListener(frameEvent, updateKeyboardHeight);
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onFrameChange.remove();
      onHide.remove();
    };
  }, [insets.bottom]);

  return {
    keyboardHeight,
    keyboardVisible: keyboardHeight > 0,
  };
}

export function ConnectGlassTabBar({ activeTab, onTabChange }: ConnectGlassTabBarProps) {
  const palette = useConnectPalette();
  const tabOrder = useMemo(() => CONNECT_TABS, []);
  const [tabLayouts, setTabLayouts] = useState<Record<ConnectTab, { x: number; width: number }>>({
    'Go!': { x: 0, width: 0 },
    Serve: { x: 0, width: 0 },
    Places: { x: 0, width: 0 },
  });
  const translateX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const activeLayout = tabLayouts[activeTab];
    if (!activeLayout || !activeLayout.width) {
      return;
    }

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: activeLayout.x,
        useNativeDriver: false,
        damping: 18,
        stiffness: 210,
        mass: 0.9,
      }),
      Animated.spring(pillWidth, {
        toValue: activeLayout.width,
        useNativeDriver: false,
        damping: 18,
        stiffness: 210,
        mass: 0.9,
      }),
    ]).start();
  }, [activeTab, pillWidth, tabLayouts, translateX]);

  return (
    <View
      style={[
        styles.mapTabsShell,
        {
          backgroundColor: palette.liquidShellOuter,
          borderColor: palette.liquidBorder,
          shadowColor: palette.liquidShadow,
          shadowOpacity: palette.liquidShadowOpacity,
        },
      ]}
    >
      <View
        style={[
          styles.mapTabsShellInner,
          {
            backgroundColor: palette.liquidShell,
            borderColor: palette.liquidInnerBorder,
          },
        ]}
      >
        <BlurView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          blurType={palette.isDark ? 'dark' : 'light'}
          blurAmount={28}
          reducedTransparencyFallbackColor={palette.glassFallback}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[palette.liquidTopHighlightStart, palette.liquidTopHighlightEnd]}
          locations={[0, 1]}
          style={styles.mapTabsTopReflection}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[palette.liquidBottomCausticStart, palette.liquidBottomCausticEnd]}
          locations={[0, 1]}
          style={styles.mapTabsBottomCaustic}
        />
        <View
          style={[styles.mapTabsOverlay, { backgroundColor: palette.liquidShellTint }]}
          pointerEvents="none"
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.mapTabActivePill,
            {
              backgroundColor: palette.liquidPillFill,
              borderColor: palette.liquidPillBorder,
              shadowColor: palette.liquidPillShadow,
              shadowOpacity: palette.liquidPillShadowOpacity,
            },
            {
              width: pillWidth,
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[palette.liquidPillToneStart, palette.liquidPillToneEnd]}
            locations={[0, 1]}
            style={styles.mapTabActivePillTone}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[palette.liquidPillHighlightStart, palette.liquidPillHighlightEnd]}
            locations={[0, 1]}
            style={styles.mapTabActivePillHighlight}
          />
        </Animated.View>

        <View style={styles.mapTabsRow}>
          {tabOrder.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => onTabChange(tab)}
                activeOpacity={0.9}
                style={styles.mapTabButton}
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  setTabLayouts((previous) => {
                    const existing = previous[tab];
                    if (existing?.x === x && existing?.width === width) {
                      return previous;
                    }

                    return {
                      ...previous,
                      [tab]: { x, width },
                    };
                  });
                }}
              >
                <StyledText
                  style={[
                    styles.mapTabText,
                    {
                      color: palette.isDark ? 'rgba(230,234,236,0.54)' : 'rgba(3,47,60,0.48)',
                    },
                    isActive ? [styles.mapTabTextActive, { color: palette.activeText }] : null,
                  ]}
                >
                  {tab}
                </StyledText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function ConnectRetractableSearchBar({
  searchText,
  onSearchChange,
  searchPlaceholder,
  onAddPress,
  onExpandedChange,
}: RetractableSearchBarProps) {
  const palette = useConnectPalette();
  const [expanded, setExpanded] = useState(Boolean(searchText));
  const [animating, setAnimating] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const expandAnim = useRef(new Animated.Value(searchText ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);
  const collapsedWidth = onAddPress ? 106 : 64;
  const expandedWidth = Math.max(collapsedWidth, containerWidth);
  const collapseSlotWidth = 46;
  const actionRowWidth = 82;
  const expandedInputWidth = Math.max(0, expandedWidth - (collapseSlotWidth + actionRowWidth + 16));

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    if (searchText && !expanded) {
      setExpanded(true);
      expandAnim.setValue(1);
    }
  }, [expandAnim, expanded, searchText]);

  const expand = useCallback(() => {
    if (animating) {
      return;
    }
    setExpanded(true);
    setAnimating(true);
    Animated.timing(expandAnim, {
      toValue: 1,
      useNativeDriver: false,
      duration: 220,
      easing: Easing.out(Easing.cubic),
    }).start(({ finished }) => {
      setAnimating(false);
      if (finished) {
        inputRef.current?.focus();
      }
    });
  }, [animating, expandAnim]);

  const collapse = useCallback(() => {
    if (animating) {
      return;
    }
    inputRef.current?.blur();
    setAnimating(true);
    Animated.timing(expandAnim, {
      toValue: 0,
      useNativeDriver: false,
      duration: 180,
      easing: Easing.out(Easing.cubic),
    }).start(({ finished }) => {
      setAnimating(false);
      if (finished) {
        onSearchChange('');
        setExpanded(false);
      }
    });
  }, [animating, expandAnim, onSearchChange]);

  const barWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedWidth, expandedWidth],
  });

  const barHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CONNECT_BOTTOM_SEARCH_ROW_HEIGHT, CONNECT_BOTTOM_SEARCH_ROW_HEIGHT],
  });

  const inputWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, expandedInputWidth],
  });

  const collapseButtonWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, collapseSlotWidth],
  });

  const handleSearchPress = useCallback(() => {
    if (expanded) {
      if (searchText) {
        inputRef.current?.focus();
        return;
      }

      collapse();
      return;
    }

    expand();
  }, [collapse, expand, expanded, searchText]);

  return (
    <View
      style={styles.retractableBarSlot}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth !== containerWidth) {
          setContainerWidth(nextWidth);
        }
      }}
    >
      <Animated.View
        style={[
          styles.retractableBar,
          {
            width: barWidth,
            height: barHeight,
            backgroundColor: palette.mapSearchBg,
            borderColor: palette.mapSearchBorder,
          },
        ]}
      >
        <BlurView
          blurType={palette.isDark ? 'dark' : 'light'}
          blurAmount={18}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            styles.retractableCollapseSlot,
            {
              width: collapseButtonWidth,
              opacity: expandAnim,
              overflow: 'hidden',
            },
          ]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <TouchableOpacity
            onPress={collapse}
            style={[
              styles.retractableIconButton,
              {
                backgroundColor: palette.mapActionBg,
                borderColor: palette.mapActionBorder,
              },
            ]}
          >
            <MaterialIcons name="chevron-right" size={22} color={palette.mapSearchIcon} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.retractableInputWrap,
            {
              width: inputWidth,
              opacity: expandAnim,
              overflow: 'hidden',
            },
          ]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <TextInput
            ref={inputRef}
            value={searchText}
            onChangeText={onSearchChange}
            placeholder={inputFocused ? '' : searchPlaceholder || 'Search...'}
            placeholderTextColor={palette.mapSearchText}
            style={[styles.retractableInput, { color: palette.textPrimary }]}
            onFocus={() => {
              setInputFocused(true);
            }}
            onBlur={() => {
              setInputFocused(false);
              if (!searchText) {
                collapse();
              }
            }}
          />
        </Animated.View>

        <View style={styles.retractableActionRow}>
          <TouchableOpacity
            onPress={handleSearchPress}
            style={[
              styles.retractableIconButton,
              {
                backgroundColor: palette.mapActionBg,
                borderColor: palette.mapActionBorder,
              },
            ]}
          >
            <MaterialIcons name="search" size={20} color={palette.mapSearchIcon} />
          </TouchableOpacity>

          {onAddPress ? (
            <TouchableOpacity
              onPress={onAddPress}
              style={[
                styles.retractableIconButton,
                {
                  backgroundColor: palette.mapActionBg,
                  borderColor: palette.mapActionBorder,
                },
              ]}
            >
              <MaterialIcons name="add" size={22} color={palette.mapSearchIcon} />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

export function ConnectPortalChrome({
  activeTab,
  onTabChange,
  userAvatarUri,
  overlay,
  headerActionIconName,
  onHeaderActionPress,
  headerActionAccessibilityLabel,
}: ChromeProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const palette = useConnectPalette();

  return (
    <View
      style={[
        styles.chromeWrap,
        overlay ? styles.chromeWrapOverlay : null,
        { backgroundColor: overlay ? 'transparent' : palette.screenBackground },
        { paddingTop: insets.top + (overlay ? spacing.x5 : spacing.x8) },
      ]}
    >
      {overlay ? (
        <>
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            blurType={palette.isDark ? 'dark' : 'light'}
            blurAmount={18}
            reducedTransparencyFallbackColor={palette.glassFallback}
          />
          <View
            style={[styles.chromeOverlayScrim, { backgroundColor: palette.overlayScrim }]}
            pointerEvents="none"
          />
        </>
      ) : null}

      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.chromeAvatarButton}
        >
          <Image
            source={{ uri: userAvatarUri || NO_PROFILE_IMAGE }}
            style={styles.userAvatar}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <StyledText style={[styles.titleText, { color: palette.textPrimary }]}>
            Connect
          </StyledText>
        </View>

        {headerActionIconName && onHeaderActionPress ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={headerActionAccessibilityLabel}
            onPress={onHeaderActionPress}
            style={[
              styles.chromeHeaderAction,
              {
                backgroundColor: palette.mapActionBg,
                borderColor: palette.mapActionBorder,
              },
            ]}
          >
            {headerActionIconName === 'map' ? (
              <NetworkPinIcon width={22} height={22} color={palette.mapSearchIcon} />
            ) : (
              <MaterialIcons name={headerActionIconName} size={22} color={palette.mapSearchIcon} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.chromeHeaderActionSpacer} />
        )}
      </View>

      <View style={styles.headerGlassTabsWrap}>
        <ConnectGlassTabBar activeTab={activeTab} onTabChange={onTabChange} />
      </View>
    </View>
  );
}

export function ConnectMapSearchRow({
  searchText,
  onSearchChange,
  searchPlaceholder,
  onSwitchToList,
  onOpenSecondaryAction,
  secondaryIconName = 'tune-variant',
}: MapSearchRowProps) {
  const palette = useConnectPalette();

  return (
    <View style={styles.mapSearchBarRow}>
      <View
        style={[
          styles.mapSearchBar,
          {
            backgroundColor: palette.mapSearchBg,
            borderColor: palette.mapSearchBorder,
            overflow: 'hidden',
          },
        ]}
      >
        <BlurView
          blurType={palette.isDark ? 'dark' : 'light'}
          blurAmount={18}
          style={StyleSheet.absoluteFill}
        />
        <MaterialIcons name="search" size={22} color={palette.mapSearchIcon} />
        <TextInput
          value={searchText}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder || 'Search places...'}
          placeholderTextColor={palette.mapSearchText}
          style={[styles.mapSearchInput, { color: palette.textPrimary }]}
        />
        <View style={[styles.mapSearchDivider, { backgroundColor: palette.mapSearchDivider }]} />
        <TouchableOpacity
          onPress={onOpenSecondaryAction}
          style={[
            styles.mapViewSwitchButton,
            {
              backgroundColor: palette.mapActionBg,
              borderColor: palette.mapActionBorder,
            },
          ]}
        >
          {secondaryIconName === 'tune-variant' ? (
            <FilterSortIcon width={20} height={20} color={palette.mapSearchIcon} />
          ) : (
            <MaterialCommunityIcons
              name={secondaryIconName}
              size={20}
              color={palette.mapSearchIcon}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSwitchToList}
          style={[
            styles.mapViewSwitchButton,
            {
              backgroundColor: palette.mapActionBg,
              borderColor: palette.mapActionBorder,
            },
          ]}
        >
          <MaterialCommunityIcons name="view-list" size={20} color={palette.mapSearchIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ConnectMapAvatarButton({ userAvatarUri }: MapAvatarButtonProps) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={styles.mapAvatarButton}
    >
      <Image
        source={{ uri: userAvatarUri || NO_PROFILE_IMAGE }}
        style={styles.mapAvatar}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

export function ConnectMapTabRow({ activeTab, onTabChange }: MapTabRowProps) {
  return (
    <View style={{ flex: 1 }}>
      <ConnectGlassTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </View>
  );
}

export function ConnectMapMarker({ iconName, active = false }: ConnectMapMarkerProps) {
  const palette = useConnectPalette();

  return (
    <View style={styles.mapMarkerPinWrap}>
      <View
        style={[
          styles.mapMarkerTail,
          {
            backgroundColor: active ? palette.markerActiveBg : palette.markerBg,
            borderColor: active ? palette.markerActiveBorder : palette.markerBorder,
            shadowColor: palette.markerShadow,
          },
        ]}
      />
      <View
        style={[
          styles.mapMarkerHead,
          active ? styles.mapMarkerHeadActive : null,
          {
            backgroundColor: active ? palette.markerActiveBg : palette.markerBg,
            borderColor: active ? palette.markerActiveBorder : palette.markerBorder,
            shadowColor: palette.markerShadow,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={active ? 20 : 18}
          color={active ? palette.markerActiveIcon : palette.markerIcon}
        />
      </View>
    </View>
  );
}

export function ConnectPlacesQuickChips<T extends ConnectQuickChip = ConnectPlacesQuickChip>({
  selectedChip,
  onSelect,
  chips,
  variant = 'default',
}: QuickChipProps<T>) {
  const palette = useConnectPalette();
  const resolvedChips: T[] = chips ?? (CONNECT_PLACE_QUICK_CHIPS as unknown as T[]);
  return (
    <ScrollView
      horizontal
      style={variant === 'default' ? styles.quickChipScroll : undefined}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.quickChipRow,
        variant === 'bottomOverlay' ? styles.quickChipRowBottomOverlay : null,
      ]}
    >
      {resolvedChips.map((chip) => {
        const isActive = chip === selectedChip;
        return (
          <TouchableOpacity
            key={chip}
            activeOpacity={0.9}
            onPress={() => onSelect(chip)}
            style={[
              styles.quickChip,
              variant === 'bottomOverlay'
                ? [
                    styles.quickChipBottomOverlay,
                    {
                      backgroundColor: isActive ? palette.chipGlassActive : palette.chipGlassBg,
                      borderWidth: 1,
                      borderColor: isActive ? palette.chipGlassActive : palette.chipGlassBorder,
                      shadowColor: '#000',
                      shadowOpacity: Platform.OS === 'android' ? 0 : isActive ? 0.16 : 0.1,
                      shadowRadius: Platform.OS === 'android' ? 0 : isActive ? 7 : 5,
                      shadowOffset:
                        Platform.OS === 'android'
                          ? { width: 0, height: 0 }
                          : { width: 0, height: 3 },
                      elevation: Platform.OS === 'android' ? 0 : isActive ? 4 : 2,
                    },
                  ]
                : { backgroundColor: palette.chip },
              isActive && variant !== 'bottomOverlay'
                ? [styles.quickChipActive, { backgroundColor: palette.chipActive }]
                : null,
            ]}
          >
            {variant === 'bottomOverlay' && (
              <BlurView
                blurType={palette.isDark ? 'dark' : 'light'}
                blurAmount={12}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
            )}
            <StyledText
              style={[
                styles.quickChipText,
                variant === 'bottomOverlay' ? styles.quickChipTextBottomOverlay : null,
                {
                  color:
                    variant === 'bottomOverlay' ? palette.chipGlassMutedText : palette.textPrimary,
                },
                isActive
                  ? [
                      styles.quickChipTextActive,
                      {
                        color: palette.activeChipText,
                      },
                    ]
                  : null,
              ]}
            >
              {chip}
            </StyledText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function ConnectPortalFilterSheet({
  visible,
  activeTab,
  onClose,
  places,
  go,
  serve,
}: ConnectPortalFilterSheetProps) {
  const palette = useConnectPalette();
  const renderOptionGroup = (
    title: string,
    options: ConnectPlaceFilterOption[],
    currentValue: string | undefined,
    onChange: (value: string) => void
  ) => (
    <View style={styles.sheetSection}>
      <StyledText style={[styles.sheetSectionTitle, { color: palette.textPrimary }]}>
        {title}
      </StyledText>
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
              style={[
                styles.sheetChip,
                { backgroundColor: palette.statBg, borderColor: palette.border },
                isActive
                  ? [
                      styles.sheetChipActive,
                      { backgroundColor: palette.chipActive, borderColor: palette.chipActive },
                    ]
                  : null,
              ]}
            >
              <StyledText
                style={[
                  styles.sheetChipText,
                  { color: palette.textPrimary },
                  isActive ? [styles.sheetChipTextActive, { color: palette.activeChipText }] : null,
                ]}
              >
                {option.label}
              </StyledText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  let title = 'Places Filters';
  let content: ReactNode = null;
  let { onReset } = places;

  if (activeTab === 'Places') {
    content = (
      <>
        {renderOptionGroup('Sort', places.sortOptions, places.filters.sort, (value) =>
          places.onApply({ sort: (value || 'nearby') as ConnectPlaceFilters['sort'] })
        )}

        {renderOptionGroup(
          'Organization Type',
          places.organizationTypes.slice(0, 10),
          places.filters.organizationTypeIds[0],
          (value) => places.onApply({ organizationTypeIds: value ? [value] : [] })
        )}

        {renderOptionGroup(
          'Denomination',
          places.churchTypes.slice(0, 10),
          places.filters.churchType,
          (value) => places.onApply({ churchType: value })
        )}

        {renderOptionGroup(
          'Size',
          ORGANIZATION_SIZE_OPTIONS,
          places.filters.organizationSize,
          (value) =>
            places.onApply({ organizationSize: value as ConnectPlaceFilters['organizationSize'] })
        )}

        <View style={styles.sheetSection}>
          <StyledText style={[styles.sheetSectionTitle, { color: palette.textPrimary }]}>
            Location
          </StyledText>
          <View
            style={[
              styles.sheetTextInputWrap,
              { backgroundColor: palette.statBg, borderColor: palette.border },
            ]}
          >
            <MaterialIcons name="place" size={18} color={CONNECT_BRAND.gray400} />
            <TextInput
              value={places.filters.locationAddress}
              onChangeText={(value) => places.onApply({ locationAddress: value })}
              placeholder="Override location"
              placeholderTextColor={CONNECT_BRAND.gray400}
              style={styles.sheetTextInput}
            />
          </View>
        </View>
      </>
    );
  } else if (activeTab === 'Go!') {
    title = 'Go! Filters';
    onReset = go.onReset;
    content = (
      <>
        {renderOptionGroup('Sort', go.sortOptions, go.filters.sort, (value) =>
          go.onApply({ sort: (value || 'upcoming') as ConnectGoFilters['sort'] })
        )}
        {renderOptionGroup('Event Type', go.eventTypeOptions, go.filters.eventType, (value) =>
          go.onApply({ eventType: value })
        )}
        {renderOptionGroup('Category', go.categoryOptions, go.filters.category, (value) =>
          go.onApply({ category: value })
        )}
        {renderOptionGroup('Mode', go.modeOptions, go.filters.mode, (value) =>
          go.onApply({ mode: value as ConnectGoFilters['mode'] })
        )}
      </>
    );
  } else {
    title = 'Serve Filters';
    onReset = serve.onReset;
    content = (
      <>
        {renderOptionGroup('Sort', serve.sortOptions, serve.filters.sort, (value) =>
          serve.onApply({ sort: (value || 'alphabetical') as ConnectServeFilters['sort'] })
        )}
        {renderOptionGroup('Role Type', serve.roleTypeOptions, serve.filters.roleType, (value) =>
          serve.onApply({ roleType: value })
        )}
        {renderOptionGroup('Tags', serve.tagOptions, serve.filters.tag, (value) =>
          serve.onApply({ tag: value })
        )}
      </>
    );
  }

  return (
    <CustomModal modalVisible={visible} onclose={onClose} style={styles.filterSheetModal}>
      <View style={[styles.filterSheetContent, { backgroundColor: palette.sheetBackground }]}>
        <View style={styles.sheetHeader}>
          <StyledText style={[styles.sheetTitle, { color: palette.textPrimary }]}>
            {title}
          </StyledText>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>

        {content}

        <View style={styles.sheetFooter}>
          <TouchableOpacity onPress={onReset} style={styles.resetButton}>
            <StyledText style={styles.resetButtonText}>Reset</StyledText>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <StyledText style={[styles.doneButtonText, { color: palette.doneButtonText }]}>
              Done
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
}

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
  const palette = useConnectPalette();
  const renderOptionGroup = (
    title: string,
    options: ConnectPlaceFilterOption[],
    currentValue: string | undefined,
    onChange: (value: string) => void
  ) => (
    <View style={styles.sheetSection}>
      <StyledText style={[styles.sheetSectionTitle, { color: palette.textPrimary }]}>
        {title}
      </StyledText>
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
              style={[
                styles.sheetChip,
                { backgroundColor: palette.statBg, borderColor: palette.border },
                isActive
                  ? [
                      styles.sheetChipActive,
                      { backgroundColor: palette.chipActive, borderColor: palette.chipActive },
                    ]
                  : null,
              ]}
            >
              <StyledText
                style={[
                  styles.sheetChipText,
                  { color: palette.textPrimary },
                  isActive ? [styles.sheetChipTextActive, { color: palette.activeChipText }] : null,
                ]}
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
      <View style={[styles.filterSheetContent, { backgroundColor: palette.sheetBackground }]}>
        <View style={styles.sheetHeader}>
          <StyledText style={[styles.sheetTitle, { color: palette.textPrimary }]}>
            Places Filters
          </StyledText>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={palette.textPrimary} />
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
          <View
            style={[
              styles.sheetTextInputWrap,
              { backgroundColor: palette.statBg, borderColor: palette.border },
            ]}
          >
            <MaterialIcons name="place" size={18} color={palette.textSecondary} />
            <TextInput
              value={filters.locationAddress}
              onChangeText={(value) => onApply({ locationAddress: value })}
              placeholder="Override location"
              placeholderTextColor={palette.inputPlaceholder}
              style={[styles.sheetTextInput, { color: palette.textPrimary }]}
            />
          </View>
        </View>

        <View style={styles.sheetFooter}>
          <TouchableOpacity onPress={onReset} style={styles.resetButton}>
            <StyledText style={styles.resetButtonText}>Reset</StyledText>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <StyledText style={[styles.doneButtonText, { color: palette.doneButtonText }]}>
              Done
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
}

export function ConnectPlaceCard({
  place,
  onPress,
  isFollowing,
  onToggleFollow,
  compact,
}: PlaceCardProps) {
  const palette = useConnectPalette();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.placeCard,
        { backgroundColor: compact ? 'transparent' : palette.card },
        compact ? styles.placeCardCompact : null,
      ]}
    >
      <View style={styles.placeCardHeader}>
        <View style={styles.placeCardIdentity}>
          <Image
            source={{ uri: place.avatarUri || NO_PROFILE_IMAGE }}
            style={styles.placeAvatar}
            resizeMode="cover"
          />
          <View style={styles.placeTitleWrap}>
            <StyledText style={[styles.placeTitle, { color: palette.textPrimary }]}>
              {place.title}
            </StyledText>
            <StyledText style={[styles.placeSubtitle, { color: palette.textSecondary }]}>
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

      <StyledText style={[styles.placeAddress, { color: palette.textPrimary }]}>
        {place.distanceLabel ? `${place.distanceLabel} • ${place.address}` : place.address}
      </StyledText>

      <View style={styles.placeTagsRow}>
        {place.metadataTags.map((tag) => (
          <View
            key={`${place.id}-${tag}`}
            style={[styles.placeTag, { backgroundColor: palette.tagBg }]}
          >
            <StyledText style={[styles.placeTagText, { color: palette.activeChipText }]}>
              {tag}
            </StyledText>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export function ConnectMapDetailPanel({
  title,
  subtitle,
  address,
  tags,
  stats,
  imageUri,
  fallbackIcon = 'location-city',
  actionLabel,
  onActionPress,
  leadingAccessory,
}: ConnectMapDetailPanelProps) {
  const palette = useConnectPalette();
  return (
    <View
      style={[
        styles.mapDetailPanel,
        { backgroundColor: palette.overlayStrong, borderColor: palette.border },
      ]}
    >
      <View style={styles.mapDetailHeader}>
        <View style={styles.mapDetailIdentity}>
          {leadingAccessory || imageUri ? (
            leadingAccessory || (
              <Image
                source={{ uri: imageUri || NO_PROFILE_IMAGE }}
                style={styles.mapDetailAvatar}
                resizeMode="cover"
              />
            )
          ) : (
            <View style={styles.mapDetailAvatarFallback}>
              <MaterialIcons name={fallbackIcon} size={22} color={palette.textPrimary} />
            </View>
          )}

          <View style={styles.mapDetailCopy}>
            <StyledText style={[styles.mapDetailTitle, { color: palette.textPrimary }]}>
              {title}
            </StyledText>
            <StyledText style={[styles.mapDetailSubtitle, { color: palette.textSecondary }]}>
              {subtitle}
            </StyledText>
          </View>
        </View>

        {actionLabel && onActionPress ? (
          <TouchableOpacity onPress={onActionPress} style={styles.mapDetailAction}>
            <StyledText style={styles.mapDetailActionText}>{actionLabel}</StyledText>
          </TouchableOpacity>
        ) : null}
      </View>

      <StyledText style={[styles.mapDetailAddress, { color: palette.textPrimary }]}>
        {address}
      </StyledText>

      {tags.length ? (
        <View style={styles.mapDetailTagsRow}>
          {tags.map((tag) => (
            <View
              key={`${title}-${tag}`}
              style={[styles.mapDetailTag, { backgroundColor: palette.tagBg }]}
            >
              <StyledText style={[styles.mapDetailTagText, { color: palette.activeChipText }]}>
                {tag}
              </StyledText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.mapDetailStatsRow}>
        {stats.map((stat) => (
          <View
            key={`${title}-${stat.label}`}
            style={[styles.mapDetailStatCard, { backgroundColor: palette.statBg }]}
          >
            <StyledText style={[styles.mapDetailStatLabel, { color: palette.textSecondary }]}>
              {stat.label}
            </StyledText>
            <StyledText style={[styles.mapDetailStatValue, { color: palette.textPrimary }]}>
              {stat.value}
            </StyledText>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ConnectMapFloatingCard({
  eyebrow,
  title,
  meta,
  supportingCopy,
  imageUri,
  fallbackIcon = 'domain',
  trailingIconName,
  primaryAction,
  secondaryAction,
  onDismiss,
}: ConnectMapFloatingCardProps) {
  const palette = useConnectPalette();

  return (
    <View
      style={[
        styles.mapPreviewCard,
        { backgroundColor: palette.mapPreviewBg, borderColor: palette.mapPreviewBorder },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          palette.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0, 1]}
        style={styles.mapPreviewGloss}
      />

      <View style={styles.mapPreviewMediaWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.mapPreviewMedia} resizeMode="cover" />
        ) : (
          <View style={styles.mapPreviewMediaFallback}>
            <MaterialCommunityIcons
              name={fallbackIcon}
              size={32}
              color={palette.mapPreviewEyebrow}
            />
          </View>
        )}
      </View>

      <View style={styles.mapPreviewCopy}>
        <View style={styles.mapPreviewTopRow}>
          <StyledText style={[styles.mapPreviewEyebrow, { color: palette.mapPreviewEyebrow }]}>
            {eyebrow}
          </StyledText>
          {trailingIconName ? (
            <MaterialIcons name={trailingIconName} size={28} color={palette.mapPreviewMeta} />
          ) : null}
        </View>

        <StyledText style={[styles.mapPreviewTitle, { color: palette.mapPreviewTitle }]}>
          {title}
        </StyledText>

        <View style={styles.mapPreviewMetaRow}>
          <MaterialIcons name="place" size={18} color={palette.mapPreviewMeta} />
          <StyledText style={[styles.mapPreviewMeta, { color: palette.mapPreviewMeta }]}>
            {meta}
          </StyledText>
        </View>

        {supportingCopy ? (
          <StyledText
            style={[styles.mapPreviewSupporting, { color: palette.mapPreviewSupporting }]}
          >
            {supportingCopy}
          </StyledText>
        ) : null}

        <View style={styles.mapPreviewActionsRow}>
          {primaryAction ? (
            <TouchableOpacity
              onPress={primaryAction.onPress}
              style={[
                styles.mapPreviewAction,
                styles.mapPreviewActionPrimary,
                { backgroundColor: palette.mapPreviewPrimaryBg },
              ]}
            >
              <StyledText
                style={[
                  styles.mapPreviewActionPrimaryText,
                  { color: palette.mapPreviewPrimaryText },
                ]}
              >
                {primaryAction.label}
              </StyledText>
            </TouchableOpacity>
          ) : null}

          {secondaryAction ? (
            <TouchableOpacity
              onPress={secondaryAction.onPress}
              style={[
                styles.mapPreviewAction,
                styles.mapPreviewActionSecondary,
                { borderColor: palette.mapPreviewSecondaryBorder },
              ]}
            >
              <StyledText
                style={[
                  styles.mapPreviewActionSecondaryText,
                  { color: palette.mapPreviewSecondaryText },
                ]}
              >
                {secondaryAction.label}
              </StyledText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          style={[styles.mapPreviewDismissButton, { backgroundColor: palette.mapPreviewDismissBg }]}
        >
          <MaterialCommunityIcons name="close" size={18} color={palette.mapPreviewMeta} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function ConnectPlaceDetailSheet({ place, isFollowing, onToggleFollow }: DetailSheetProps) {
  return (
    <ConnectMapDetailPanel
      title={place.title}
      subtitle={
        [place.organizationTypeLabel, place.churchTypeLabel].filter(Boolean).join(' • ') ||
        'Organization'
      }
      address={place.distanceLabel ? `${place.distanceLabel} • ${place.address}` : place.address}
      tags={place.metadataTags}
      stats={[
        { label: 'Distance', value: place.distanceLabel || 'N/A' },
        { label: 'Status', value: place.isOpen ? 'Open now' : 'Active' },
        { label: 'Followers', value: String(place.followerCount || 0) },
      ]}
      imageUri={place.avatarUri || NO_PROFILE_IMAGE}
      actionLabel={isFollowing ? 'Following' : 'Follow'}
      onActionPress={onToggleFollow}
    />
  );
}

const styles = StyleSheet.create({
  chromeWrap: {
    backgroundColor: CONNECT_BRAND.backgroundDark,
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x5,
    gap: spacing.x5,
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
    minHeight: 46,
  },
  chromeAvatarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 40,
  },
  titleText: {
    ...Typography.header.h1,
    color: '#032f3c',
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: CONNECT_BRAND.infoBase,
  },
  headerGlassTabsWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x5,
  },
  chromeHeaderAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chromeHeaderActionSpacer: {
    width: 40,
    height: 40,
  },
  searchActionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.x10,
  },
  searchInputWrap: {
    flex: 0.7,
    minHeight: 52,
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
    minHeight: 52,
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
  mapAvatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: CONNECT_BRAND.infoBase,
  },
  mapSearchBarRow: {
    paddingHorizontal: spacing.x16,
  },
  mapSearchBar: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(14,19,26,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  mapSearchInput: {
    flex: 1,
    color: CONNECT_BRAND.gray100,
    fontSize: 18,
    fontWeight: '600',
  },
  mapSearchDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(230,234,236,0.15)',
    marginVertical: 12,
  },
  mapViewSwitchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mapTabsShell: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(202,222,230,0.92)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#032f3c',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  mapTabsShellInner: {
    margin: 1.5,
    borderRadius: 23,
    overflow: 'hidden',
    padding: 4,
    borderWidth: 1,
  },
  mapTabsTopReflection: {
    position: 'absolute',
    top: 1,
    left: 6,
    right: 6,
    height: '24%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 1,
  },
  mapTabsBottomCaustic: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 1,
    height: '20%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 1,
  },
  mapTabsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3,47,60,0.28)',
  },
  mapTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  mapTabActivePill: {
    position: 'absolute',
    top: 3.5,
    bottom: 3.5,
    left: 4,
    borderRadius: 17,
    backgroundColor: 'rgba(65,137,159,0.26)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.98)',
    shadowColor: '#032f3c',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  mapTabActivePillTone: {
    ...StyleSheet.absoluteFillObject,
  },
  mapTabActivePillHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: '32%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  mapTabButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x8,
  },
  mapTabText: {
    ...Typography.body.x2M,
    color: 'rgba(230,234,236,0.7)',
    fontWeight: '700',
    fontFamily: 'Rubik',
    letterSpacing: 0.15,
  },
  mapTabTextActive: {
    color: CONNECT_BRAND.infoBase,
    fontWeight: '800',
  },
  quickChipRow: {
    alignItems: 'center',
    gap: spacing.x10,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x5,
  },
  quickChipScroll: {
    flexGrow: 0,
  },
  quickChipRowBottomOverlay: {
    paddingHorizontal: spacing.x16,
    paddingVertical: 0,
    gap: spacing.x10,
  },
  quickChip: {
    alignSelf: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x8,
    borderRadius: borderRadius.button,
    backgroundColor: CONNECT_BRAND.surface,
    justifyContent: 'center',
  },
  quickChipBottomOverlay: {
    minHeight: 36,
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x8,
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(79,109,119,0.92)',
    borderRadius: 20,
  },
  quickChipActive: {
    backgroundColor: CONNECT_BRAND.primaryBase,
  },
  quickChipText: {
    ...Typography.body.x1M,
    fontSize: 14,
    lineHeight: 18,
    color: CONNECT_BRAND.gray100,
    fontWeight: '600',
    fontFamily: 'Rubik',
  },
  quickChipTextBottomOverlay: {
    fontSize: 12,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    fontWeight: '700',
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
    fontFamily: 'Rubik-Bold',
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
  mapDetailPanel: {
    borderTopLeftRadius: borderRadius.card,
    borderTopRightRadius: borderRadius.card,
    backgroundColor: 'rgba(3,47,60,0.96)',
    paddingHorizontal: spacing.x20,
    paddingTop: spacing.x16,
    paddingBottom: spacing.x20,
    gap: spacing.x13,
    borderWidth: 1,
    borderColor: 'rgba(79,109,119,0.56)',
  },
  mapDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.x10,
  },
  mapDetailIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x13,
  },
  mapDetailAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: CONNECT_BRAND.surface,
  },
  mapDetailAvatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(79,109,119,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDetailCopy: {
    flex: 1,
    gap: spacing.x5,
  },
  mapDetailTitle: {
    ...Typography.header.h3,
    color: CONNECT_BRAND.gray100,
    fontWeight: '700',
  },
  mapDetailSubtitle: {
    ...Typography.body.x2M,
    color: CONNECT_BRAND.gray400,
  },
  mapDetailAction: {
    minWidth: 104,
    minHeight: 44,
    borderRadius: borderRadius.button,
    borderWidth: 1.5,
    borderColor: CONNECT_BRAND.infoBase,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x16,
  },
  mapDetailActionText: {
    color: CONNECT_BRAND.infoBase,
    fontWeight: '700',
  },
  mapDetailAddress: {
    ...Typography.body.x2M,
    color: CONNECT_BRAND.gray100,
  },
  mapDetailTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.x10,
  },
  mapDetailTag: {
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x8,
    borderRadius: borderRadius.button,
    backgroundColor: '#97c0cd',
  },
  mapDetailTagText: {
    color: CONNECT_BRAND.backgroundDark,
    fontSize: 12,
    fontWeight: '700',
  },
  mapDetailStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.x10,
  },
  mapDetailStatCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(79,109,119,0.22)',
    padding: spacing.x13,
    justifyContent: 'space-between',
  },
  mapDetailStatLabel: {
    color: CONNECT_BRAND.gray400,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  mapDetailStatValue: {
    color: CONNECT_BRAND.gray100,
    fontWeight: '700',
    ...Typography.body.x2M,
  },
  mapMarkerPinWrap: {
    width: 56,
    height: 62,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mapMarkerTail: {
    position: 'absolute',
    top: 18,
    width: 24,
    height: 24,
    borderRadius: 7,
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  mapMarkerHead: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  mapMarkerHeadActive: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  mapPreviewCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 168,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  mapPreviewGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  mapPreviewMediaWrap: {
    width: 118,
    alignSelf: 'stretch',
  },
  mapPreviewMedia: {
    width: '100%',
    height: '100%',
  },
  mapPreviewMediaFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(3,47,60,0.18)',
  },
  mapPreviewCopy: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: spacing.x16,
    gap: spacing.x8,
  },
  mapPreviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.x10,
    paddingRight: 28,
  },
  mapPreviewEyebrow: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  mapPreviewTitle: {
    ...Typography.header.h3,
    fontWeight: '800',
  },
  mapPreviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x5,
  },
  mapPreviewMeta: {
    ...Typography.body.x2M,
    flex: 1,
    fontWeight: '600',
  },
  mapPreviewSupporting: {
    ...Typography.body.x1,
    fontWeight: '600',
  },
  mapPreviewActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
    marginTop: 'auto',
  },
  mapPreviewAction: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: spacing.x16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPreviewActionPrimary: {
    backgroundColor: CONNECT_BRAND.infoBase,
  },
  mapPreviewActionSecondary: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  mapPreviewActionPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mapPreviewActionSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mapPreviewDismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retractableBarSlot: {
    width: '100%',
    minHeight: CONNECT_BOTTOM_SEARCH_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  retractableBar: {
    minHeight: CONNECT_BOTTOM_SEARCH_ROW_HEIGHT,
    borderRadius: CONNECT_BOTTOM_SEARCH_ROW_HEIGHT / 2,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: 'hidden',
  },
  retractableCollapseSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  retractableInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retractableActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
  },
  retractableInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: spacing.x5,
  },
  retractableIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
