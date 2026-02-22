import React from 'react';
import { View, TouchableOpacity, SafeAreaView, Platform, Animated, Easing } from 'react-native';

import { TabView } from 'react-native-tab-view';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import styles from './styles';

import WallComponent from '@/components/prayerWallComponent';
import PrayersComponent from '@/components/prayerWallMyPrayersComponent';
import TestimoniesComponent from '@/components/prayerWallTestimoniesComponent';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { fontSize } from '@/src/styles/typography';
import PrayerWallSavedPrayersComponent from '@/components/prayerWallSavedPrayersComponent';

type Props = StackScreenProps<PrayerWallStackParamsList, 'index'>;

function Prayer({ navigation }: Props) {
  const isIOS = Platform.OS === 'ios';
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Wall', title: 'Wall' },
    { key: 'Testimonies', title: 'Testimonies' },
    { key: 'Saved', title: 'Saved' },
    { key: 'MyPrayers', title: 'My Prayers' },
  ]);
  const [tabBarWidth, setTabBarWidth] = React.useState(0);
  const liquidTranslate = React.useRef(new Animated.Value(0)).current;
  const liquidStretch = React.useRef(new Animated.Value(1)).current;
  const hasInitializedLiquidRef = React.useRef(false);
  const { colors, dark } = useTheme();
  const [areSubtabsVisible, setAreSubtabsVisible] = React.useState(true);
  const lastPrayerScrollY = React.useRef(0);
  const lastPrayerSubtabToggleAt = React.useRef(0);
  const areSubtabsVisibleRef = React.useRef(true);
  const hasInitializedPrayerScroll = React.useRef(false);
  const setSubtabsVisibility = React.useCallback((visible: boolean) => {
    if (areSubtabsVisibleRef.current === visible) {
      return;
    }
    areSubtabsVisibleRef.current = visible;
    setAreSubtabsVisible(visible);
  }, []);
  const handlePrayerWallScroll = React.useCallback(
    (offsetY: number) => {
      const now = Date.now();
      const nextY = Math.max(0, offsetY);
      const delta = nextY - lastPrayerScrollY.current;
      const threshold = 4;
      const topZoneThreshold = 16;
      const toggleCooldownMs = 140;

      if (!hasInitializedPrayerScroll.current) {
        hasInitializedPrayerScroll.current = true;
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (nextY <= topZoneThreshold) {
        setSubtabsVisibility(true);
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (Math.abs(delta) <= threshold) {
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (now - lastPrayerSubtabToggleAt.current < toggleCooldownMs) {
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (delta > 0) {
        setSubtabsVisibility(false);
      } else {
        setSubtabsVisibility(true);
      }

      lastPrayerSubtabToggleAt.current = now;
      lastPrayerScrollY.current = nextY;
    },
    [setSubtabsVisibility]
  );

  useFocusEffect(
    React.useCallback(() => {
      hasInitializedPrayerScroll.current = false;
      lastPrayerScrollY.current = 0;
      lastPrayerSubtabToggleAt.current = 0;
      setSubtabsVisibility(true);
      return undefined;
    }, [setSubtabsVisibility])
  );
  let shareBackgroundColor = 'transparent';
  if (!isIOS) {
    shareBackgroundColor = dark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)';
  }
  const shareButtonStyle = isIOS
    ? {
        position: 'absolute' as const,
        bottom: spacing.x24,
        alignSelf: 'center' as const,
        alignItems: 'center' as const,
        paddingVertical: 0,
        backgroundColor: 'transparent',
      }
    : {
        position: 'absolute' as const,
        bottom: 1,
        left: 0,
        right: 0,
        alignItems: 'center' as const,
        paddingVertical: spacing.x8,
        backgroundColor: shareBackgroundColor,
      };

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'Wall':
        return <WallComponent onScrollOffsetChange={handlePrayerWallScroll} />;
      case 'Testimonies':
        return <TestimoniesComponent onScrollOffsetChange={handlePrayerWallScroll} />;
      case 'Saved':
        return <PrayerWallSavedPrayersComponent onScrollOffsetChange={handlePrayerWallScroll} />;
      case 'MyPrayers':
        return <PrayersComponent onScrollOffsetChange={handlePrayerWallScroll} />;
      default:
        return null;
    }
  };
  const tabWidth = tabBarWidth > 0 ? tabBarWidth / routes.length : 0;

  React.useEffect(() => {
    if (tabWidth <= 0) {
      return;
    }
    const toValue = index * tabWidth;
    if (!hasInitializedLiquidRef.current) {
      liquidTranslate.setValue(toValue);
      hasInitializedLiquidRef.current = true;
      return;
    }
    Animated.parallel([
      Animated.timing(liquidTranslate, {
        toValue,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(liquidStretch, {
          toValue: 1.2,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(liquidStretch, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index, liquidStretch, liquidTranslate, tabWidth]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          swipeEnabled={false}
          renderScene={renderScene}
          sceneContainerStyle={{ marginBottom: spacing.x88 }}
          renderTabBar={(props) => {
            if (!areSubtabsVisible) {
              return null;
            }
            return (
              <View
                style={styles.tabBar}
                onLayout={(event) => {
                  const nextWidth = event.nativeEvent.layout.width;
                  if (Math.abs(nextWidth - tabBarWidth) > 1) {
                    setTabBarWidth(nextWidth);
                  }
                }}
              >
                {tabWidth > 0 ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.liquidIndicatorContainer,
                      {
                        width: tabWidth,
                        transform: [{ translateX: liquidTranslate }],
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.liquidCore,
                        {
                          transform: [{ scaleX: liquidStretch }],
                        },
                      ]}
                    />
                    <Animated.View style={[styles.liquidBlob, styles.liquidBlobLeft]} />
                    <Animated.View style={[styles.liquidBlob, styles.liquidBlobRight]} />
                  </Animated.View>
                ) : null}
                {props.navigationState.routes.map((route, i) => {
                  return (
                    <TouchableOpacity
                      key={route.key}
                      style={styles.tabItem}
                      onPress={() => setIndex(i)}
                    >
                      {props?.navigationState?.index === i ? (
                        <StyledText
                          style={{ color: colors.text, fontWeight: 'bold', ...fontSize.x092 }}
                        >
                          {route.title}
                        </StyledText>
                      ) : (
                        <StyledText style={{ color: colors.text, ...fontSize.x092 }}>
                          {route.title}
                        </StyledText>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          }}
          onIndexChange={(nextIndex) => {
            setIndex(nextIndex);
            hasInitializedPrayerScroll.current = false;
            lastPrayerScrollY.current = 0;
            lastPrayerSubtabToggleAt.current = 0;
            setSubtabsVisibility(true);
          }}
        />
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Prayer');
          }}
          style={shareButtonStyle}
        >
          <StyledText
            style={{
              color: Colors.primarySapphire.brand,
              textDecorationLine: 'underline',
            }}
          >
            Share a Prayer 🙏
          </StyledText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
export default Prayer;
