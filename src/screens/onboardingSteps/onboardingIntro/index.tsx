import React, { useEffect, useRef } from 'react';
import {
  View,
  SafeAreaView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import { useTheme, CommonActions } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import Ionicons from '@react-native-vector-icons/ionicons';

import { RootState } from '@/src/redux/reducers/rootReducer';
import { OnboardingStackParamList } from '@/src/navigator/types';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { Colors, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { spacing } from '@/src/styles/spacing';
import { HapticService } from '@/src/services/haptic';

const introImage = require('@/assets/images/onboarding_intro.png');

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingIntro'>;

function OnboardingIntro({ navigation }: Props) {
  const authState = useSelector((state: RootState) => state.auth);
  const { dark } = useTheme();
  const isIos = Platform.OS === 'ios';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle breathing pulse – longer & subtler in 2026 style
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04, // very gentle amplitude
          duration: 3200,
          easing: Easing.bezier(0.4, 0, 0.2, 1), // smooth natural in/out
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    );

    // Very slow elegant rotation of background layer
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 18000, // slower = more premium/calm
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    spinLoop.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulseAnim, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleNext = () => {
    HapticService.trigger('impactMedium');
    if (authState.getProfileData?.accountType === 'individual') {
      navigation.push('OnboardingDateOfBirth');
    } else {
      navigation.push('OnboardingOrganizationType');
    }
  };

  const handleBack = () => {
    HapticService.trigger('impactMedium');
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Intro' }],
      })
    );
  };

  // Theme-aware colors (adjusted to match your original intent)
  const bgLayerOpacity = 0.15; // even more subtle
  const textColor = dark ? Colors.main.black : Colors.primary.brand;
  const headerColor = dark ? Colors.primarySapphire[400] : Colors.primary.brand;
  const glassBorderColor = dark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.35)';
  const glassBackground = dark ? 'rgba(10, 18, 24, 0.35)' : 'rgba(255, 255, 255, 0.22)';
  const glassRadius =
    typeof button.primary.borderRadius === 'number' ? button.primary.borderRadius : 60;

  return (
    <>
      {Platform.OS === 'android' && (
        <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      )}
      <SafeAreaView
        style={{
          flex: 1,
          marginHorizontal: spacing.x24,
          marginBottom: Platform.OS === 'android' ? spacing.x24 : 0,
        }}
      >
        {isIos ? (
          <View
            style={{
              position: 'absolute',
              top: 80,
              left: 0,
              zIndex: 10,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: glassBorderColor,
              backgroundColor: glassBackground,
            }}
          >
            <BlurView
              blurType={dark ? 'dark' : 'light'}
              blurAmount={18}
              reducedTransparencyFallbackColor={
                dark ? Colors.primarySapphire[900] : Colors.neutral[900]
              }
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TouchableOpacity
                onPress={handleBack}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
            </BlurView>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleBack}
            style={{
              position: 'absolute',
              top: spacing.x32,
              left: 0,
              zIndex: 10,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={24} color={headerColor} />
          </TouchableOpacity>
        )}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View
            style={{
              flex: 4,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: '100%',
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.x32,
              }}
            >
              {/* Subtle rotating background layer */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transform: [{ rotate: spin }],
                }}
              >
                <AnimatedFastImage
                  resizeMode="contain"
                  style={{ width: '100%', height: '100%', opacity: bgLayerOpacity }}
                  source={introImage}
                />
              </Animated.View>

              {/* Main icon with gentle breathing pulse */}
              <AnimatedFastImage
                resizeMode="contain"
                style={{
                  width: '70%',
                  height: '70%',
                  transform: [{ scale: pulseAnim }],
                }}
                source={introImage}
              />
            </View>

            <StyledText
              style={[
                Typography.header.h1,
                {
                  color: headerColor,
                  marginVertical: spacing.x8,
                },
              ]}
            >
              Let&#39;s Get to Know You
            </StyledText>

            <StyledText
              style={{
                marginHorizontal: spacing.x16,
                textAlign: 'center',
                color: textColor,
              }}
            >
              This should only take about a minute to complete.
            </StyledText>
          </View>

          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            {isIos ? (
              <BlurView
                blurType={dark ? 'dark' : 'light'}
                blurAmount={18}
                reducedTransparencyFallbackColor={
                  dark ? Colors.primarySapphire[900] : Colors.neutral[900]
                }
                style={{
                  width: '100%',
                  borderRadius: glassRadius,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: glassBorderColor,
                  backgroundColor: glassBackground,
                }}
              >
                <Button
                  text="Get Started"
                  btnStyle={[button.primary, { flex: 1, backgroundColor: 'transparent' }]}
                  onPress={handleNext}
                  btnTextStyle={{ color: '#FFF' }}
                />
              </BlurView>
            ) : (
              <Button
                text="Get Started"
                btnStyle={[button.primary, { flex: 1 }]}
                onPress={handleNext}
                btnTextStyle={{ color: '#FFF' }}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

export default OnboardingIntro;
