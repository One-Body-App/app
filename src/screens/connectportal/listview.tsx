import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { Menu } from 'iconoir-react-native';
import { Notification } from 'iconsax-react-native';
import { DrawerActions, useFocusEffect, useNavigation, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '@/components/styled/Text';
import { ConnectStackParamsList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { getHeight } from '@/utils/ResponsiveFun';
import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import {
  formatConnectPortalDateTime,
  trackConnectPortalEventTelemetry,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { CONNECT_PORTAL_LIST_DATA, type ConnectPortalListItem, type ConnectTab } from './data';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectPortal'>;

type HeaderProps = {
  activeTab: ConnectTab;
  onTabChange: (tab: ConnectTab) => void;
};

function ConnectPortalHeader({ activeTab, onTabChange }: HeaderProps): React.JSX.Element {
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const styles = useMemo(() => createStyles(dark), [dark]);

  const headerRowHeight = getHeight(5.8);
  const headerSideWidth = headerRowHeight;

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const handleNotifications = () => {
    navigation.navigate('MainRoot', {
      screen: 'Main',
      params: { screen: 'HomeTab', params: { screen: 'Notifications' } },
    });
  };

  return (
    <View
      style={[
        styles.portalHeaderWrap,
        { paddingTop: insets.top },
        Platform.OS === 'android'
          ? {
              backgroundColor: dark ? '#0D0D0D' : colors.background,
              borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : Colors.neutral[500],
            }
          : null,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <>
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            blurType={dark ? 'dark' : 'light'}
            blurAmount={20}
            reducedTransparencyFallbackColor={colors.background}
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: dark ? 'rgba(13,13,13,0.78)' : 'rgba(255,255,255,0.78)',
              },
            ]}
          />
        </>
      ) : null}

      <View style={[styles.headerRow, { height: headerRowHeight }]}>
        <View style={[styles.headerSideAction, { width: headerSideWidth }]}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleOpenDrawer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Menu
              color={dark ? Colors.neutral[700] : Colors.primarySapphire.brand}
              height={24}
              width={24}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.headerSideAction, { width: headerSideWidth }]}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleNotifications}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Notification
              size={24}
              color={dark ? Colors.neutral[700] : Colors.primarySapphire.brand}
              variant="Linear"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenterWrap} pointerEvents="box-none">
          <View style={styles.headerLogoWrap}>
            {dark ? (
              <LogoWhite style={{ height: 28, width: 28 }} />
            ) : (
              <Logo style={{ height: 28, width: 28 }} />
            )}
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {(['Places', 'Go!', 'Serve'] as ConnectTab[]).map((tab) => {
          const isActive = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive ? styles.tabItemActive : null]}
              onPress={() => onTabChange(tab)}
              activeOpacity={0.85}
            >
              <StyledText style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                {tab}
              </StyledText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ListViewScreen({ navigation, route }: Props): React.JSX.Element {
  const { dark } = useTheme();
  const styles = useMemo(() => createStyles(dark), [dark]);
  const screenEnterTranslateX = useRef(new Animated.Value(120)).current;
  const screenEnterOpacity = useRef(new Animated.Value(0)).current;
  const initialRouteTab = route.params?.initialTab;
  const { snapshot, refresh } = useConnectPortalData();

  const [activeTab, setActiveTab] = useState<ConnectTab>(initialRouteTab ?? 'Places');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  useFocusEffect(
    useCallback(() => {
      screenEnterTranslateX.setValue(120);
      screenEnterOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(screenEnterTranslateX, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(screenEnterOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        screenEnterTranslateX.setValue(120);
        screenEnterOpacity.setValue(0);
      };
    }, [screenEnterOpacity, screenEnterTranslateX])
  );

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'Go!') {
        refresh();
      }
    }, [activeTab, refresh])
  );

  const items = useMemo<ConnectPortalListItem[]>(
    () =>
      activeTab === 'Go!'
        ? snapshot.publicPublished.map((eventRecord) => ({
            id: eventRecord.id,
            title: eventRecord.title,
            location: `${
              eventRecord.venueName || eventRecord.address || 'Location TBD'
            } • ${formatConnectPortalDateTime(eventRecord)}`,
            tags: eventRecord.tags.length > 0 ? eventRecord.tags : ['Event'],
            icon: 'event',
          }))
        : (CONNECT_PORTAL_LIST_DATA[activeTab] ?? []),
    [activeTab, snapshot.publicPublished]
  );

  const filteredItems = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(term) || item.location.toLowerCase().includes(term)
    );
  }, [items, searchText]);

  let heroTitle = 'Find Ways to Serve';
  if (activeTab === 'Places') {
    heroTitle = 'Find Organizations Near You';
  } else if (activeTab === 'Go!') {
    heroTitle = 'Discover Local Events';
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: screenEnterOpacity, transform: [{ translateX: screenEnterTranslateX }] },
      ]}
    >
      <ConnectPortalHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
      >
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={18} color={Colors.primarySapphire.brand} />
            <TextInput
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              placeholderTextColor={dark ? Colors.neutral[500] : Colors.primary[400]}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, styles.toggleBtnActive]}
              activeOpacity={0.9}
            >
              <MaterialIcons name="view-list" size={16} color={Colors.main.white} />
              <StyledText style={[styles.toggleText, styles.toggleTextActive]}>
                List View
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => navigation.navigate('ConnectMap', { initialTab: activeTab })}
              activeOpacity={0.9}
            >
              <MaterialIcons name="map" size={16} color={Colors.primarySapphire.brand} />
              <StyledText style={styles.toggleText}>Map View</StyledText>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'Go!' ? (
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={() => navigation.navigate('ConnectGoEventDash')}
            activeOpacity={0.9}
          >
            <View style={styles.createEventIconWrap}>
              <MaterialIcons name="add-circle-outline" size={20} color={Colors.main.white} />
            </View>
            <View style={styles.createEventCopy}>
              <StyledText style={styles.createEventTitle}>Create Event</StyledText>
              <StyledText style={styles.createEventBody}>
                Open the organizer dashboard and start a new `Go!` event.
              </StyledText>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroWrapper}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1465220183275-07cd0c2cc7a3' }}
            style={styles.heroBackground}
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroOverlay}>
              <StyledText style={styles.heroTitle}>{heroTitle}</StyledText>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('ConnectMap', { initialTab: activeTab })}
                activeOpacity={0.9}
              >
                <MaterialIcons name="public" size={16} color={Colors.primary.brand} />
                <StyledText style={styles.exploreBtnText}>Explore Map</StyledText>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <StyledText style={styles.listTitle}>Recommended for You</StyledText>
            <TouchableOpacity activeOpacity={0.8}>
              <StyledText style={styles.viewAllText}>View All</StyledText>
            </TouchableOpacity>
          </View>

          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.cardContainer}
              activeOpacity={0.86}
              onPress={() => {
                if (activeTab === 'Go!') {
                  trackConnectPortalEventTelemetry(item.id, 'detail_open', {
                    source: 'connect_list',
                  }).catch(() => {});
                  navigation.navigate('ConnectGoEventView', { eventId: item.id });
                }
              }}
            >
              <View style={styles.cardIconWrap}>
                <MaterialIcons name={item.icon} size={30} color={Colors.primarySapphire.brand} />
              </View>
              <View style={styles.cardContent}>
                <StyledText style={styles.cardTitle}>{item.title}</StyledText>
                <StyledText style={styles.cardLocation}>{item.location}</StyledText>
                <View style={styles.tagsRow}>
                  {item.tags.map((tag) => (
                    <View
                      key={`${item.id}-${tag}`}
                      style={[
                        styles.tagBadge,
                        tag === 'Active' ? styles.tagBadgeGreen : styles.tagBadgePrimary,
                      ]}
                    >
                      <StyledText
                        style={[
                          styles.tagText,
                          tag === 'Active' ? styles.tagTextGreen : styles.tagTextPrimary,
                        ]}
                      >
                        {tag.toUpperCase()}
                      </StyledText>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? Colors.main.white : Colors.neutral[700],
    },
    portalHeaderWrap: {
      overflow: 'hidden',
      borderBottomWidth: 1,
      borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : Colors.neutral[500],
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.x16,
    },
    headerSideAction: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenterWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerLogoWrap: {
      height: 44,
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.x16,
      paddingTop: spacing.x5,
      paddingBottom: spacing.x8,
      borderTopWidth: 1,
      borderTopColor: dark ? 'rgba(255,255,255,0.05)' : Colors.neutral[500],
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingBottom: spacing.x8,
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    tabItemActive: {
      borderBottomColor: Colors.primarySapphire.brand,
    },
    tabText: {
      ...Typography.body.x2M,
      color: dark ? Colors.primary[700] : Colors.primary[300],
    },
    tabTextActive: {
      color: dark ? Colors.primarySapphire[700] : Colors.primary.brand,
      fontWeight: '700',
    },
    scrollContent: {
      flex: 1,
    },
    scrollBody: {
      paddingBottom: spacing.x24,
    },
    searchSection: {
      padding: spacing.x20,
      gap: spacing.x10,
    },
    createEventButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.x20,
      marginBottom: spacing.x16,
      paddingHorizontal: spacing.x16,
      paddingVertical: spacing.x13,
      borderRadius: borderRadius.large,
      backgroundColor: Colors.primary.brand,
      gap: spacing.x13,
    },
    createEventIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
    createEventCopy: {
      flex: 1,
      gap: spacing.x5,
    },
    createEventTitle: {
      ...Typography.body.x2M,
      color: Colors.main.white,
      fontWeight: '700',
    },
    createEventBody: {
      ...Typography.body.x1,
      color: 'rgba(255,255,255,0.88)',
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: dark ? '#111B20' : 'rgba(18, 107, 135, 0.05)',
      borderRadius: borderRadius.base,
      paddingHorizontal: spacing.x16,
      height: 48,
      borderWidth: 1,
      borderColor: dark ? 'rgba(18,107,135,0.35)' : 'rgba(18, 107, 135, 0.1)',
      gap: spacing.x8,
    },
    searchInput: {
      flex: 1,
      color: dark ? Colors.main.black : Colors.primary.brand,
      ...Typography.body.x3,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: dark ? '#111B20' : 'rgba(18, 107, 135, 0.05)',
      borderRadius: borderRadius.button,
      padding: 4,
      height: 44,
      borderWidth: 1,
      borderColor: dark ? 'rgba(18,107,135,0.35)' : 'rgba(18, 107, 135, 0.1)',
    },
    toggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.button,
      gap: spacing.x5,
    },
    toggleBtnActive: {
      backgroundColor: Colors.primarySapphire.brand,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: { elevation: 2 },
      }),
    },
    toggleText: {
      ...Typography.body.x1M,
      color: dark ? Colors.primarySapphire[700] : Colors.primary[300],
    },
    toggleTextActive: {
      color: Colors.main.white,
    },
    heroWrapper: {
      paddingHorizontal: spacing.x20,
      marginBottom: spacing.x20,
    },
    heroBackground: {
      width: '100%',
      height: 176,
      borderRadius: borderRadius.base,
      justifyContent: 'flex-end',
      overflow: 'hidden',
      backgroundColor: Colors.primarySapphire.brand,
    },
    heroImage: {
      borderRadius: borderRadius.base,
    },
    heroOverlay: {
      backgroundColor: 'rgba(3, 47, 60, 0.45)',
      padding: spacing.x16,
      gap: spacing.x8,
    },
    heroTitle: {
      ...Typography.header.h4,
      color: Colors.main.white,
    },
    exploreBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.x5,
      backgroundColor: Colors.main.white,
      borderRadius: borderRadius.button,
      paddingHorizontal: spacing.x10,
      paddingVertical: spacing.x5,
    },
    exploreBtnText: {
      ...Typography.body.x1M,
      color: Colors.primary.brand,
    },
    listSection: {
      paddingHorizontal: spacing.x20,
      gap: spacing.x10,
    },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.x5,
    },
    listTitle: {
      ...Typography.header.h4,
      color: dark ? Colors.primary[700] : Colors.primary.brand,
    },
    viewAllText: {
      ...Typography.body.x2M,
      color: Colors.primarySapphire.brand,
    },
    cardContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: dark ? '#111B20' : Colors.main.white,
      borderRadius: borderRadius.base,
      borderWidth: 1,
      borderColor: dark ? 'rgba(18,107,135,0.35)' : Colors.neutral[500],
      padding: spacing.x13,
      gap: spacing.x10,
    },
    cardIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dark ? 'rgba(18, 210, 217, 0.14)' : 'rgba(18, 210, 217, 0.1)',
    },
    cardContent: {
      flex: 1,
      gap: spacing.x5,
    },
    cardTitle: {
      ...Typography.body.x2M,
      color: dark ? Colors.primary[700] : Colors.primary.brand,
      fontWeight: '700',
    },
    cardLocation: {
      ...Typography.body.x1,
      color: dark ? Colors.primary[500] : Colors.primary[300],
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.x5,
      marginTop: 2,
    },
    tagBadge: {
      paddingHorizontal: spacing.x8,
      paddingVertical: 4,
      borderRadius: borderRadius.button,
    },
    tagBadgePrimary: {
      backgroundColor: dark ? 'rgba(18,210,217,0.2)' : 'rgba(18,210,217,0.14)',
    },
    tagBadgeGreen: {
      backgroundColor: dark ? 'rgba(65,219,225,0.2)' : 'rgba(65,219,225,0.16)',
    },
    tagText: {
      ...Typography.body.x1,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    tagTextPrimary: {
      color: Colors.primarySapphire.brand,
    },
    tagTextGreen: {
      color: '#13A36D',
    },
  });

export default ListViewScreen;
