import React, { useEffect, useRef } from 'react';
import {
  View,
  SafeAreaView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import { useTheme, CommonActions } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import Ionicons from '@react-native-vector-icons/ionicons';
import { LoginManager } from 'react-native-fbsdk-next';
import { clearAuthTokens } from '@/services/authTokens';

import { RootState } from '@/src/redux/reducers/rootReducer';
import { OnboardingStackParamList } from '@/src/navigator/types';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { HapticService } from '@/src/services/haptic';
import { logout } from '@/src/redux/actions/AuthActions';

const introImage = require('@/assets/images/onboarding_intro.png');

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);
const { width } = Dimensions.get('window');

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingIntro'>;

function OnboardingIntro({ navigation }: Props) {
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { dark } = useTheme();
  const isIos = Platform.OS === 'ios';

  // Animation Refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const introFade = useRef(new Animated.Value(0)).current;
  const introSlide = useRef(new Animated.Value(20)).current;

  // Define One Body Brand Colors
  const BRAND_PRIMARY = '#41899f';
  const BRAND_ACCENT = '#12d2d9';
  const BRAND_GRAY_BASE = '#3c4b64';
  const BRAND_BLACK = '#032f3c';

  useEffect(() => {
    // 1. Entrance Animation (Fade + Slide up)
    Animated.parallel([
      Animated.timing(introFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(introSlide, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous "Breathing" Pulse for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [introFade, introSlide, pulseAnim]);

  const handleNext = () => {
    HapticService.trigger('impactMedium');
    if (authState.getProfileData?.accountType === 'individual') {
      navigation.push('OnboardingDateOfBirth');
    } else {
      navigation.push('OnboardingOrganizationType');
    }
  };

  const handleBack = async () => {
    HapticService.trigger('impactMedium');
    try {
      LoginManager.logOut();
      await clearAuthTokens();
    } catch {
      /* ignore */
    }
    dispatch(logout());
    const parentNavigation = navigation.getParent();
    const resetAction = CommonActions.reset({
      index: 0,
      routes: [{ name: 'Intro' }],
    });
    if (parentNavigation) parentNavigation.dispatch(resetAction);
    else navigation.dispatch(resetAction);
  };

  // Visibility & Theme Logic
  const textColor = dark ? '#e6eaec' : BRAND_GRAY_BASE;
  const headerColor = dark ? BRAND_ACCENT : BRAND_PRIMARY;
  const stageBg = dark ? 'rgba(60, 75, 100, 0.2)' : 'rgba(230, 234, 236, 0.5)';
  const glowColor = dark ? BRAND_PRIMARY : BRAND_ACCENT;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* LOGO STAGE: This ensures the light asset is visible in both modes */}
          <Animated.View
            style={[
              styles.logoStage,
              {
                backgroundColor: stageBg,
                shadowColor: glowColor,
                opacity: introFade,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <AnimatedFastImage resizeMode="contain" style={styles.logoImage} source={introImage} />
          </Animated.View>

          <Animated.View
            style={{
              opacity: introFade,
              transform: [{ translateY: introSlide }],
              alignItems: 'center',
            }}
          >
            <StyledText
              style={[Typography.header.h1, { color: headerColor, marginBottom: spacing.x13 }]}
            >
              Let&#39;s Get to Know You
            </StyledText>

            <StyledText style={[styles.description, { color: textColor }]}>
              This should only take about a minute to complete.
            </StyledText>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: introFade }]}>
          {isIos ? (
            <BlurView blurType={dark ? 'dark' : 'light'} blurAmount={20} style={styles.blurWrapper}>
              <Button
                text="Get Started"
                btnStyle={[styles.mainBtn, { backgroundColor: 'transparent' }]}
                onPress={handleNext}
                btnTextStyle={{ color: '#FFF', fontWeight: '700' }}
              />
            </BlurView>
          ) : (
            <Button
              text="Get Started"
              btnStyle={[styles.mainBtn, { backgroundColor: BRAND_PRIMARY }]}
              onPress={handleNext}
              btnTextStyle={{ color: '#FFF', fontWeight: '700' }}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity onPress={handleBack} style={[styles.backButton, { top: isIos ? 60 : 20 }]}>
        <Ionicons name="chevron-back" size={28} color={headerColor} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.x24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  logoStage: {
    width: width * 0.65,
    aspectRatio: 1,
    borderRadius: (width * 0.65) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.x48,
    // Glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  logoImage: {
    width: '60%',
    height: '60%',
  },
  description: {
    marginHorizontal: spacing.x32,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    paddingBottom: spacing.x24,
  },
  blurWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 107, 135, 0.8)',
  },
  mainBtn: {
    height: 56,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: spacing.x16,
    zIndex: 10,
    padding: 8,
  },
});

export default OnboardingIntro;
