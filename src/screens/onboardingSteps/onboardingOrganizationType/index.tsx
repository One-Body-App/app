import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  FlatListProps,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { useToast } from 'react-native-toast-notifications';
import useMountEffect from '@/src/hooks/useMountEffect';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { AccountType, OrganizationType } from '@/utils/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import { preloadSoundEffect, playSoundEffect } from '@/src/services/soundEffects';
import pickerClickSound from '../../../assets/sounds/click.wav';
import { navigateWithinCurrentNavigator } from '@/src/navigator/navigateWithinCurrentNavigator';
import { OnboardingStackParamList } from '@/src/navigator/types';
import {
  buildOrganizationCategoryGroups,
  OrganizationCategoryKey,
} from '@/src/utils/organizationCategories';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationType'>;

type PickerItem = {
  label: string;
  value: string;
};

const ITEM_HEIGHT = 70;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function InlineWheelPicker({
  items,
  scrollY,
  onScroll,
  onScrollBeginDrag,
  dark,
  listRef,
}: {
  items: PickerItem[];
  scrollY: Animated.Value;
  onScroll: FlatListProps<PickerItem>['onScroll'];
  onScrollBeginDrag?: FlatListProps<PickerItem>['onScrollBeginDrag'];
  dark: boolean;
  listRef: React.RefObject<FlatList<PickerItem> | null>;
}) {
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<PickerItem>) => {
      const inputRange = [
        (index - 1) * ITEM_HEIGHT,
        index * ITEM_HEIGHT,
        (index + 1) * ITEM_HEIGHT,
      ];

      const scale = scrollY.interpolate({
        inputRange,
        outputRange: [0.85, 1.15, 0.85],
        extrapolate: 'clamp',
      });

      const opacity = scrollY.interpolate({
        inputRange,
        outputRange: [0.3, 1, 0.3],
        extrapolate: 'clamp',
      });

      const color = dark
        ? '#FFF'
        : scrollY.interpolate({
            inputRange,
            outputRange: [Colors.neutral[300], Colors.primary.brand, Colors.neutral[300]],
            extrapolate: 'clamp',
          });

      return (
        <View style={styles.itemContainer}>
          <Animated.Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              Typography.header.h3,
              {
                transform: [{ scale }],
                opacity,
                color: color as any,
                textAlign: 'center',
                paddingHorizontal: spacing.x16,
              },
            ]}
          >
            {item.label}
          </Animated.Text>
        </View>
      );
    },
    [dark, scrollY]
  );

  return (
    <View style={styles.pickerFrame}>
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
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.value}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        scrollEventThrottle={16}
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
  );
}

function OnboardingOrganizationType({ navigation }: Props) {
  const { dark } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [organizationTypes, setOrganizationTypes] = useState<OrganizationType[]>([]);
  const [selectedOrganizationCategory, setSelectedOrganizationCategory] = useState<
    OrganizationCategoryKey | ''
  >('');

  const toast = useToast();
  const categoryScrollY = useRef(new Animated.Value(0)).current;
  const categoryListRef = useRef<FlatList<PickerItem> | null>(null);
  const lastTriggeredCategoryIndex = useRef<number>(-1);
  const categoryInteractionStarted = useRef(false);

  const organizationCategoryGroups = useMemo(
    () => buildOrganizationCategoryGroups(organizationTypes),
    [organizationTypes]
  );
  const organizationCategoryItems = useMemo(
    () =>
      organizationCategoryGroups.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    [organizationCategoryGroups]
  );

  const getOrganizationTypes = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'global/OrganizationType',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setOrganizationTypes(res?.response as OrganizationType[]);
      } else if (__DEV__) {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      if (__DEV__) {
        console.log('saga error -- ', e.toString());
      }
    }
  }, [token]);

  useMountEffect(() => {
    preloadSoundEffect('pickerClick', pickerClickSound, 0.2).catch(() => {
      if (__DEV__) {
        console.warn('Picker click sound failed to preload');
      }
    });

    if (token) {
      getOrganizationTypes();
    }
  });

  const handleCategoryScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: categoryScrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!categoryInteractionStarted.current) {
          return;
        }

        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);

        if (
          index !== lastTriggeredCategoryIndex.current &&
          index >= 0 &&
          index < organizationCategoryItems.length
        ) {
          lastTriggeredCategoryIndex.current = index;
          const nextCategory = organizationCategoryItems[index].value as OrganizationCategoryKey;
          setSelectedOrganizationCategory(nextCategory);
          playSoundEffect('pickerClick', 0.025);
        }
      },
    }
  );

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (!selectedOrganizationCategory) {
          toast.show('Organization category is required', {
            type: 'danger',
          });
          return;
        }

        navigateWithinCurrentNavigator(navigation, 'OnboardingOrganizationSubtype', {
          selectedOrganizationCategory,
        });
      }}
      onboardingType={AccountType.organization}
      activeStep={1}
      disabled={!selectedOrganizationCategory}
      dontUseScrollView
      reasonText={
        <StyledText style={{ color: Colors.primary.brand }}>
          We ask for your Organization Type to better foster connection. This allows us to recommend
          meaningful content to you and, for Organizations, ensures you are accurately represented
          to the community. Rest assured, you control who sees this information via your Profile
          Settings.
        </StyledText>
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
            What type of Organization are you?
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Select your organization category
          </StyledText>
        </View>

        <View style={styles.pickersContainer}>
          <View style={styles.pickerSection}>
            <StyledText style={styles.pickerLabel}>Category</StyledText>
            <InlineWheelPicker
              items={organizationCategoryItems}
              scrollY={categoryScrollY}
              onScroll={handleCategoryScroll}
              onScrollBeginDrag={() => {
                categoryInteractionStarted.current = true;
              }}
              dark={dark}
              listRef={categoryListRef}
            />
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}

export default OnboardingOrganizationType;

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.x20,
    flex: 1,
  },
  header: {
    marginBottom: spacing.x24,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerFrame: {
    height: PICKER_HEIGHT,
    width: '100%',
  },
  pickersContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.x8,
  },
  pickerLabel: {
    ...Typography.body.x2M,
    color: Colors.neutral[300],
    marginBottom: spacing.x12,
    textAlign: 'center',
  },
  pickerSection: {
    marginBottom: spacing.x24,
  },
  selectionLine: {
    position: 'absolute',
    width: '60%',
    left: '20%',
    borderBottomWidth: 1,
    zIndex: -1,
  },
});
