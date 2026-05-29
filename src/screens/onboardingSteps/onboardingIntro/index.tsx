import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import LottieView from 'lottie-react-native';
import { useTheme } from '@react-navigation/native';
import useMountEffect from '@/src/hooks/useMountEffect';
import type { OnboardingStackParamList } from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
// eslint-disable-next-line import/extensions
import onboardingIntroAnimation from '../../../assets/animations/onboarding-intro.json';

// One Body Color Palette
const COLORS = {
  background: '#e6eaec', // Gray 100
  textPrimary: '#032f3c', // Black
  textSecondary: '#4f6d77', // Gray 700
  button: '#126b87', // Primary Dark
  buttonText: '#ffffff',
  accent: '#12d2d9', // Info Brand Accent (for subtle highlights)
};

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingIntro'>;

function OnboardingIntro({ navigation }: Props) {
  const accountType = useSelector((state: RootState) => state.auth.getProfileData?.accountType);
  const animationRef = useRef<React.ElementRef<typeof LottieView>>(null);
  const { dark } = useTheme();

  useMountEffect(() => {
    animationRef.current?.play();
  });

  const handleGetStarted = () => {
    if (accountType === 'organization') {
      navigation.replace('OnboardingOrganizationType');
    } else {
      navigation.replace('OnboardingDateOfBirth');
    }
  };

  return (
    <SafeAreaView style={[styles.container, dark && styles.containerDark]}>
      {/* 1. The Lottie Animation Container */}
      <View style={styles.animationContainer}>
        <LottieView
          ref={animationRef}
          source={onboardingIntroAnimation}
          autoPlay
          loop
          style={styles.lottie}
          resizeMode="contain"
        />
      </View>

      {/* 2. Mission-Aligned Messaging */}
      <View style={styles.contentContainer}>
        <Text style={[styles.title, dark && styles.titleDark]}>Let&#39;s Get to Know You</Text>
        <Text style={[styles.subtitle, dark && styles.subtitleDark]}>
          This should take about a minute to complete.
        </Text>

        {/* 3. Call to Action */}
        <Pressable style={[styles.button, dark && styles.buttonDark]} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#0D0D0D',
  },
  animationContainer: {
    flex: 2, // Takes up top 66% of screen
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  lottie: {
    width: 300,
    height: 300,
  },
  contentContainer: {
    flex: 1, // Takes up bottom 33%
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  titleDark: {
    color: '#f6f6f7',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  subtitleDark: {
    color: '#b9c7cc',
  },
  button: {
    backgroundColor: COLORS.button,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50, // Pill shape
    width: '100%',
    boxShadow: '0 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  buttonDark: {
    backgroundColor: '#126b87',
  },
  buttonText: {
    color: COLORS.buttonText,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OnboardingIntro;

OnboardingIntro.propTypes = {
  navigation: PropTypes.shape({
    replace: PropTypes.func.isRequired,
  }).isRequired,
};
