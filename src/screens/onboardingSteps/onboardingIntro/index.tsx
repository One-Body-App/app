import React, { useEffect, useRef } from 'react';
import { View, SafeAreaView, Platform, ScrollView, Animated, Easing } from 'react-native';
import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@react-navigation/native';

import { RootState } from '@/src/redux/reducers/rootReducer';
import { OnboardingStackParamList } from '@/src/navigator/types';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { Colors, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { spacing } from '@/src/styles/spacing';

const introImage = require('@/assets/images/onboarding_intro.png');

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingIntro'>;

function OnboardingIntro({ navigation }: Props) {
  const authState = useSelector((state: RootState) => state.auth);
  const { dark } = useTheme();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 12000,
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
    if (authState.getProfileData?.accountType === 'individual') {
      navigation.push('OnboardingChurchType');
    } else {
      navigation.push('OnboardingOrganizationType');
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginHorizontal: spacing.x24,
        marginBottom: Platform.OS === 'android' ? spacing.x24 : 0,
      }}
    >
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
              width: '60%',
              aspectRatio: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.x32,
            }}
          >
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
                style={{ width: '100%', height: '100%', opacity: 0.2 }}
                source={introImage}
              />
            </Animated.View>

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
                color: dark ? Colors.primarySapphire[400] : Colors.primary.brand,
                marginVertical: spacing.x8,
              },
            ]}
          >
            Let’s Get to Know You
          </StyledText>
          <StyledText
            style={{
              marginHorizontal: spacing.x16,
              textAlign: 'center',
              color: dark ? Colors.main.black : Colors.primary.brand,
            }}
          >
            This should only take about 2-3 minutes to complete.
          </StyledText>
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Button
            text="Get Started"
            btnStyle={[
              button.primary,
              {
                flex: 1,
              },
            ]}
            onPress={handleNext}
            btnTextStyle={{ color: '#FFF' }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default OnboardingIntro;
