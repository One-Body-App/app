import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import useMountEffect from '@/src/hooks/useMountEffect';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { AccountType } from '@/utils/types';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { Colors, Typography } from '@/src/styles';
import { preloadSoundEffect, playSoundEffect } from '@/src/services/soundEffects';
import pickerClickSound from '../../../assets/sounds/click.wav';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingDateOfBirth'>;

// Configuration for the Wheel Picker
const ITEM_HEIGHT = 90; // Height of each year item
const VISIBLE_ITEMS = 3; // How many items to see (1 center, 1 above, 1 below)
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function OnboardingDateOfBirth({ navigation }: Props) {
  const { dark, colors } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [year, setYear] = useState<string>();
  const [hasInteracted, setHasInteracted] = useState(false);
  const baseFontSize =
    typeof Typography.header.h2.fontSize === 'number' ? Typography.header.h2.fontSize : 20;
  const baseLineHeight =
    typeof Typography.header.h2.lineHeight === 'number' ? Typography.header.h2.lineHeight : 30;
  const yearFontSize = baseFontSize * 2;
  const yearLineHeight = baseLineHeight * 2;
  const pickerTranslateY = -windowHeight * 0.1;

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;

  // Generate years dynamically (Min age 7, Max age 90)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 7;
    const minYear = currentYear - 90;
    const yearList = [];
    for (let i = maxYear; i >= minYear; i--) {
      yearList.push(i.toString());
    }
    return yearList;
  }, []);

  const handleNext = () => {
    const selectedYear = year ?? years[0];

    if (selectedYear) {
      ReactNativeHapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      navigation.navigate('OnboardingLocation', {
        dateOfBirth: selectedYear,
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
  useMountEffect(() => {
    // Set initial year to the first item in the list automatically
    if (!year && years.length > 0) {
      setYear(years[0]);
      lastTriggeredIndex.current = 0;
    }

    preloadSoundEffect('pickerClick', pickerClickSound, 0.2).catch(() => {
      if (__DEV__) {
        console.warn('Picker click sound failed to preload');
      }
    });
  });

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
              fontSize: yearFontSize,
              lineHeight: yearLineHeight,
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
      buttonText={hasInteracted ? 'Next' : 'Skip'}
      onPress={handleNext}
      onboardingType={AccountType.individual}
      activeStep={1}
      dontUseScrollView
      reasonText={
        <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
          We use this to recommend relevant groups and fellowship opportunities. Your age is{' '}
          <StyledText style={{ fontWeight: 'bold', color: Colors.primary.brand }}>
            private
          </StyledText>{' '}
          and will never be displayed on your profile.
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
            When were you born?
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              { color: dark ? Colors.main.black : Colors.neutral[300], marginTop: spacing.x8 },
            ]}
          >
            This helps us curate content relevant to your season of life.
          </StyledText>
        </View>

        {/* CENTERED WHEEL PICKER */}
        <View
          style={{
            flex: 4,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ translateY: pickerTranslateY }],
          }}
        >
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
              onScrollBeginDrag={() => setHasInteracted(true)}
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
