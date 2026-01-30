import React, { useEffect, useRef } from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import {
  View,
  Animated,
  Easing,
  InteractionManager,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import Color from 'color';
import { header, subheader } from '@/src/styles/typography';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import UserStepsLayout from '../layout/UserStepsLayout';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { spacing } from '@/src/styles/spacing';
import { MainStackParamList } from '@/src/navigator/types';
import { HapticService } from '@/src/services/haptic';
import logogroupImg from '@/assets/images/logogroup.png';
import logogroupDarkImg from '@/assets/images/logogroupdark.png';
import avatar1Img from '@/assets/images/avatar1.png';
import avatar2Img from '@/assets/images/avatar2.png';
import avatar3Img from '@/assets/images/avatar3.png';
import avatar4Img from '@/assets/images/avatar4.png';
import searchIconImg from '@/assets/images/searchIcon.png';
import discoverIconImg from '@/assets/images/discoverIcon.png';

const CONTENT_MAX_WIDTH = 720;
const HERO_MAX_WIDTH = 520;
const BUTTONS_MAX_WIDTH = 520;

const ASSETS = {
  logogroup: logogroupImg,
  logogroupDark: logogroupDarkImg,
  avatar1: avatar1Img,
  avatar2: avatar2Img,
  avatar3: avatar3Img,
  avatar4: avatar4Img,
  searchIcon: searchIconImg,
  discoverIcon: discoverIconImg,
};

type Props = StackScreenProps<MainStackParamList, 'Intro'>;

function IntroScreen({ navigation }: Props) {
  const { colors, dark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const isIos = Platform.OS === 'ios';

  // 1. Entry Animations (Legacy)
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const primaryBtnAnim = useRef(new Animated.Value(0)).current;
  const secondaryBtnAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  // 2. Continuous Loop Animations (Solar System)
  const loopAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasAnimated.current) {
      return undefined;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      hasAnimated.current = true;

      const sweepAndWobble = (anim: Animated.Value) =>
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.85,
            duration: 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]);

      // Start Entry Animation
      Animated.sequence([
        Animated.timing(orbitAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.parallel([sweepAndWobble(primaryBtnAnim), sweepAndWobble(secondaryBtnAnim)]),
      ]).start();

      // Start Infinite Solar System Loop (0 -> 1)
      Animated.loop(
        Animated.timing(loopAnim, {
          toValue: 1,
          duration: 40000, // slowed to half speed (40s)
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
    return () => task.cancel();
  }, [orbitAnim, textAnim, loopAnim, primaryBtnAnim, secondaryBtnAnim]);

  // --- Interpolations ---

  // Entry Fly-in
  const orbitEntryStyle = {
    opacity: orbitAnim,
    transform: [
      { scale: orbitAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
      { translateY: orbitAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
    ],
  };

  const textPopStyle = {
    opacity: textAnim,
    transform: [
      { scale: textAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      { translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  const buttonWobble = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 1],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [36, 0],
        }),
      },
      {
        rotate: anim.interpolate({
          inputRange: [0, 0.85, 1],
          outputRange: ['8deg', '-4deg', '0deg'],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  });

  // Solar System Rotations
  const rotateCW = loopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateCCW = loopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  // Counter-Rotation (Keeps avatars upright)
  const counterRotateCW = loopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const counterRotateCCW = loopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-360deg', '0deg'],
  });

  const ringStyles = {
    outer: {
      backgroundColor: dark ? '#0f1a1f' : '#F8FBFC',
      borderColor: dark ? '#1d2a33' : '#E7F0F3',
    },
    middle: {
      backgroundColor: dark ? '#14212b' : '#E7F0F3',
      borderColor: dark ? '#253643' : '#D0E1E7',
    },
    inner: {
      backgroundColor: dark ? '#1c2c37' : '#D0E1E7',
      borderColor: dark ? '#2e4250' : '#b3c1c5',
    },
  };

  const sunStyle = {
    backgroundColor: dark ? colors.card : '#fff',
    shadowColor: Colors.primary.brand,
  };
  const glassBorderColor = dark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.35)';
  const glassBackground = dark ? 'rgba(10, 18, 24, 0.35)' : 'rgba(255, 255, 255, 0.22)';
  const glassRadius =
    typeof button.primary.borderRadius === 'number' ? button.primary.borderRadius : 60;
  const primaryGlassFill = Color(Colors.primarySapphire.brand).alpha(0.75).rgb().string();

  return (
    <UserStepsLayout backgroundColor={colors.background}>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 0,
          flexBasis: 'auto',
          alignItems: isTablet ? 'center' : undefined,
        }}
      >
        {/* --- ANIMATED SOLAR SYSTEM CONTAINER --- */}
        <Animated.View
          style={{
            flexGrow: 1,
            flexShrink: 0,
            flexBasis: 300,
            marginTop: spacing.x32,
            alignItems: 'center',
            justifyContent: 'center',
            height: 350, // Enlarged hero height to contain larger orbit
            width: isTablet ? '100%' : undefined,
            maxWidth: isTablet ? HERO_MAX_WIDTH : undefined,
            ...orbitEntryStyle,
          }}
        >
          <View style={styles.solarSystem}>
            {/* 1. Static Rings (The Water Ripples) */}
            <View style={[styles.ring, styles.ringOuter, ringStyles.outer]} />
            <View style={[styles.ring, styles.ringMiddle, ringStyles.middle]} />
            <View style={[styles.ring, styles.ringInner, ringStyles.inner]} />

            {/* 2. Central Sun (The Logo) */}
            <View style={[styles.sunContainer, sunStyle]}>
              <FastImage
                source={dark ? ASSETS.logogroupDark : ASSETS.logogroup}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* 3. Outer Orbit Track (Clockwise) */}
            <Animated.View
              style={[styles.orbitTrack, styles.trackOuter, { transform: [{ rotate: rotateCW }] }]}
            >
              {/* Avatar 1 (Top Right) */}
              <Animated.View
                style={[
                  styles.planetParams,
                  { top: 0, right: '20%', transform: [{ rotate: counterRotateCW }] },
                ]}
              >
                <FastImage source={ASSETS.avatar1} style={styles.avatarLarge} />
              </Animated.View>

              {/* Avatar 2 (Bottom Left) */}
              <Animated.View
                style={[
                  styles.planetParams,
                  { bottom: '10%', left: '20%', transform: [{ rotate: counterRotateCW }] },
                ]}
              >
                <FastImage source={ASSETS.avatar2} style={styles.avatarMedium} />
              </Animated.View>

              {/* Discover Icon (Far Right) */}
              <Animated.View
                style={[
                  styles.planetParams,
                  { top: '50%', right: -15, transform: [{ rotate: counterRotateCW }] },
                ]}
              >
                <View style={styles.iconBubble}>
                  <Image source={ASSETS.discoverIcon} style={styles.iconSmall} />
                </View>
              </Animated.View>
            </Animated.View>

            {/* 4. Inner Orbit Track (Counter-Clockwise) */}
            <Animated.View
              style={[styles.orbitTrack, styles.trackInner, { transform: [{ rotate: rotateCCW }] }]}
            >
              {/* Avatar 3 (Top Left) */}
              <Animated.View
                style={[
                  styles.planetParams,
                  { top: '15%', left: 0, transform: [{ rotate: counterRotateCCW }] },
                ]}
              >
                <FastImage source={ASSETS.avatar3} style={styles.avatarMedium} />
              </Animated.View>

              {/* Search Icon (Bottom Right) */}
              <Animated.View
                style={[
                  styles.planetParams,
                  { bottom: '20%', right: 0, transform: [{ rotate: counterRotateCCW }] },
                ]}
              >
                <View style={styles.iconBubble}>
                  <Image source={ASSETS.searchIcon} style={styles.iconSmall} />
                </View>
              </Animated.View>

              {/* Avatar 4 (Bottom Center) */}
              <Animated.View
                style={[
                  styles.planetParams,
                  { bottom: -15, left: '50%', transform: [{ rotate: counterRotateCCW }] },
                ]}
              >
                <FastImage source={ASSETS.avatar4} style={styles.avatarSmall} />
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.View>
        {/* --- END ANIMATION --- */}

        <View
          style={{
            flexGrow: 1,
            flexBasis: 400,
            width: isTablet ? '100%' : undefined,
            maxWidth: isTablet ? CONTENT_MAX_WIDTH : undefined,
          }}
        >
          <View
            style={{
              paddingTop: 60,
              justifyContent: 'space-between',
              flex: 1,
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <View style={{ flex: 1, paddingBottom: 40 }}>
              <View style={{ flex: 1 }}>
                <Animated.View
                  style={[{ flexDirection: 'row', justifyContent: 'center' }, textPopStyle]}
                >
                  <StyledText
                    style={[
                      header.h2,
                      { color: dark ? '#f6f6f6' : Colors.primary.brand, fontWeight: 'bold' },
                    ]}
                  >
                    Welcome to{' '}
                  </StyledText>
                  <StyledText
                    style={[
                      header.h2,
                      {
                        color: dark ? '#12d2d9' : Colors.primarySapphire.brand,
                        fontWeight: 'bold',
                      },
                    ]}
                  >
                    One Body
                  </StyledText>
                </Animated.View>

                <Animated.View style={[{ marginHorizontal: 25 }, textPopStyle]}>
                  <StyledText
                    style={[
                      subheader.M,
                      {
                        color: dark ? '#f6f6f6' : Colors.primary.brand,
                        textAlign: 'center',
                        marginTop: 10,
                      },
                    ]}
                  >
                    Join the global community of believers. Discover Christian creators, find local
                    Churches, and unite in Prayer with the Body of Christ worldwide.
                  </StyledText>
                </Animated.View>
              </View>

              <View
                style={{
                  marginHorizontal: spacing.x20,
                  marginTop: spacing.x20,
                  ...(isTablet
                    ? { width: '100%', maxWidth: BUTTONS_MAX_WIDTH, alignSelf: 'center' }
                    : {}),
                }}
              >
                <Animated.View
                  style={[
                    {
                      shadowColor: Colors.primary.brand,
                      shadowOpacity: 0.125,
                      shadowOffset: { width: 0, height: 6 },
                      shadowRadius: 10,
                      elevation: 4,
                    },
                    buttonWobble(primaryBtnAnim),
                  ]}
                >
                  {isIos ? (
                    <View
                      style={{
                        width: '100%',
                        alignSelf: 'stretch',
                        borderRadius: glassRadius,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: glassBorderColor,
                        backgroundColor: glassBackground,
                        marginBottom: 15,
                      }}
                    >
                      <BlurView
                        blurType={dark ? 'dark' : 'light'}
                        blurAmount={18}
                        reducedTransparencyFallbackColor={
                          dark ? Colors.primarySapphire[900] : Colors.neutral[900]
                        }
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Button
                        btnStyle={[button.primary, { flex: 1, backgroundColor: primaryGlassFill }]}
                        onPress={() => {
                          HapticService.trigger();
                          navigation.navigate('AccountType');
                        }}
                        text="Join the Family"
                        btnTextStyle={{ color: 'white' }}
                      />
                    </View>
                  ) : (
                    <Button
                      btnStyle={[button.primary, { marginBottom: 15, flex: 1 }]}
                      onPress={() => {
                        HapticService.trigger();
                        navigation.navigate('AccountType');
                      }}
                      text="Join the Family"
                      btnTextStyle={{ color: 'white' }}
                    />
                  )}
                </Animated.View>

                <Animated.View
                  style={[
                    {
                      shadowColor: Colors.primary.brand,
                      shadowOpacity: 0.1,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
                      elevation: 3,
                    },
                    buttonWobble(secondaryBtnAnim),
                  ]}
                >
                  {isIos ? (
                    <View
                      style={{
                        width: '100%',
                        alignSelf: 'stretch',
                        borderRadius: glassRadius,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: glassBackground,
                      }}
                    >
                      <BlurView
                        blurType={dark ? 'dark' : 'light'}
                        blurAmount={18}
                        reducedTransparencyFallbackColor={
                          dark ? Colors.primarySapphire[900] : Colors.neutral[900]
                        }
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Button
                        btnStyle={[
                          button.outline,
                          {
                            flex: 1,
                            backgroundColor: 'transparent',
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => {
                          HapticService.trigger();
                          navigation.navigate('Login');
                        }}
                        text="I have an account"
                        btnTextStyle={{ color: dark ? '#f6f6f6' : Colors.primary.brand }}
                      />
                    </View>
                  ) : (
                    <Button
                      btnStyle={[
                        button.outline,
                        { flex: 1, backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => {
                        HapticService.trigger();
                        navigation.navigate('Login');
                      }}
                      text="I have an account"
                      btnTextStyle={{ color: dark ? '#f6f6f6' : Colors.primary.brand }}
                    />
                  )}
                </Animated.View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </UserStepsLayout>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  solarSystem: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The Rings (Static Backgrounds)
  ring: {
    position: 'absolute',
    borderRadius: 999, // Circle
    borderWidth: 1,
  },
  ringOuter: {
    width: 280,
    height: 280,
    backgroundColor: '#F8FBFC', // Ripple 1
    borderColor: '#E7F0F3',
  },
  ringMiddle: {
    width: 200,
    height: 200,
    backgroundColor: '#E7F0F3', // Ripple 2
    borderColor: '#D0E1E7',
  },
  ringInner: {
    width: 130,
    height: 130,
    backgroundColor: '#D0E1E7', // Ripple 3
    borderColor: '#b3c1c5',
  },
  // The Sun (Center Logo)
  sunContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    // Shadow
    shadowColor: '#126b87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: 180,
    height: 180,
    tintColor: '#032f3c',
  },
  // The Invisible Tracks that Rotate
  orbitTrack: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackOuter: { width: 360, height: 360 },
  trackInner: { width: 260, height: 260 },

  // The Container for each Planet (Avatar/Icon)
  planetParams: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Avatar Sizes
  avatarLarge: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#126B87',
  },
  avatarMedium: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#126B87',
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#126B87',
  },
  // Icons (Search/Discover)
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E7F0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSmall: {
    width: 16,
    height: 16,
    tintColor: '#126B87',
  },
});

export default IntroScreen;
