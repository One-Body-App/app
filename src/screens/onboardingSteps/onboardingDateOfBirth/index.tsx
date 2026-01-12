import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { StackScreenProps } from '@react-navigation/stack';
import { useToast } from 'react-native-toast-notifications';
import { useTheme } from '@react-navigation/native';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { Colors, Typography } from '@/src/styles';
import { preloadSoundEffect, playSoundEffect } from '@/src/services/soundEffects';
// eslint-disable-next-line import/extensions
import pickerClickSound from '../../../assets/sounds/click.wav';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingDateOfBirth'>;

// Configuration for the Wheel Picker
const ITEM_HEIGHT = 60; // Height of each year item
const VISIBLE_ITEMS = 3; // How many items to see (1 center, 1 above, 1 below)
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function OnboardingDateOfBirth({ navigation, route }: Props) {
  const { dark, colors } = useTheme();
  const [year, setYear] = useState<string>();
  const toast = useToast();

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;

  // Generate years dynamically (Min age 16, Max age 90)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 16;
    const minYear = currentYear - 90;
    const yearList = [];
    for (let i = maxYear; i >= minYear; i--) {
      yearList.push(i.toString());
    }
    return yearList;
  }, []);

  const handleNext = () => {
    if (year) {
      navigation.navigate('OnboardingLocation', {
        ...route.params,
        dateOfBirth: year,
      });
    } else {
      toast.show('Year of birth is required', {
        type: 'danger',
      });
    }
  };

  // Track the last index that triggered feedback to avoid duplicates
  const lastTriggeredIndex = useRef<number>(-1);

  // Handle Scroll to determine selection and trigger feedback
  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
    listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);

      // Trigger feedback when a new item enters the center
      if (index !== lastTriggeredIndex.current && index >= 0 && index < years.length) {
        lastTriggeredIndex.current = index;
        const selectedYear = years[index];
        setYear(selectedYear);

        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(`📍 Year changed to: ${selectedYear} (index: ${index})`);
        }

        // Trigger haptic and sound immediately
        ReactNativeHapticFeedback.trigger('impactLight', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
        playSoundEffect('pickerClick', 0.025);
      }
    },
  });

  // Initial selection (set the first year as default)
  useEffect(() => {
    // Set initial year to the first item in the list automatically
    if (!year && years.length > 0) {
      setYear(years[0]);
      lastTriggeredIndex.current = 0;
    }
  }, [years, year]);

  useEffect(() => {
    preloadSoundEffect('pickerClick', pickerClickSound, 0.2).catch(() => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('🔇 Picker click sound failed to preload');
      }
    });
  }, []);

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const inputRange = [(index - 1) * ITEM_HEIGHT, index * ITEM_HEIGHT, (index + 1) * ITEM_HEIGHT];

    // Scale animation: Center item is larger
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.8, 1.3, 0.8], // 1.3 scale for selected
      extrapolate: 'clamp',
    });

    // Opacity animation: Center item is clear, others faded
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    const color = scrollY.interpolate({
      inputRange,
      outputRange: [
        dark ? Colors.neutral[500] : Colors.neutral[400],
        dark ? '#FFF' : Colors.primary.brand, // Selected Color
        dark ? Colors.neutral[500] : Colors.neutral[400],
      ],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.Text
          style={[
            Typography.header.h2, // Base font size
            {
              transform: [{ scale }],
              opacity,
              color: color as any, // Cast to avoid TS issues with Animated colors
              fontWeight: '700',
            },
          ]}
        >
          {item}
        </Animated.Text>
      </View>
    );
  };

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={handleNext}
      onboardingType={AccountType.individual}
      activeStep={1}
      disabled={!year}
      dontUseScrollView
      showCustomHeaderOnAndroid
      reasonText={
        <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
          Your year of birth helps us to understand the type of content you would be most interested
          in seeing so that we may enhance your One Body experience.{' '}
          <StyledText style={{ fontWeight: 'bold', color: Colors.primary.brand }}>
            We do NOT publicly display this information.
          </StyledText>
        </StyledText>
      }
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText
            style={[
              Typography.header.h1,
              { color: dark ? Colors.primarySapphire[400] : Colors.primary.brand },
            ]}
          >
            What is your year of birth?
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              { color: dark ? Colors.main.black : Colors.neutral[300], marginTop: spacing.x8 },
            ]}
          >
            Swipe to select
          </StyledText>
        </View>

        {/* CENTERED WHEEL PICKER */}
        <View style={{ flex: 4, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ height: PICKER_HEIGHT, width: '100%' }}>
            {/* Selection Indicator Lines (Optional visuals to frame the center) */}
            <View
              style={[
                styles.selectionLine,
                {
                  top: ITEM_HEIGHT,
                  borderColor: Colors.secondary.brand,
                },
              ]}
            />
            <View
              style={[
                styles.selectionLine,
                {
                  bottom: ITEM_HEIGHT,
                  borderColor: Colors.secondary.brand,
                },
              ]}
            />

            <Animated.FlatList
              data={years}
              keyExtractor={(item) => item}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              // Padding allows the first and last items to reach the center
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT,
              }}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
            />
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}

const styles = StyleSheet.create({
  selectionLine: {
    position: 'absolute',
    width: '60%', // Don't span full width for cleaner look
    left: '20%',
    borderBottomWidth: 1,
    zIndex: -1, // Behind the text
  },
});

export default OnboardingDateOfBirth;
