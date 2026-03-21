import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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
import { OnboardingStackParamList } from '@/src/navigator/types';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationType'>;

const ITEM_HEIGHT = 70;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function OnboardingOrganizationType({ navigation }: Props) {
  const { dark } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const windowHeight = Dimensions.get('window').height;
  const [organizationTypes, setOrganizationTypes] = useState<OrganizationType[]>([]);
  const [selectedOrganizationType, setSelectedOrganizationType] =
    useState<OrganizationType['_id']>('');

  const toast = useToast();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastTriggeredIndex = useRef<number>(-1);
  const pickerTranslateY = -windowHeight * 0.1;

  const organizationTypeItems = organizationTypes.map((item) => ({
    label: item.organizationType ?? item.name ?? '',
    value: item._id,
  }));

  const getOrganizationTypes = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'global/OrganizationType',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        const items = res?.response as OrganizationType[];
        setOrganizationTypes(items);

        if (!selectedOrganizationType && items.length > 0) {
          const churchIndex = items.findIndex((item) => {
            const label = (item.organizationType ?? item.name ?? '').trim().toLowerCase();
            return label === 'church';
          });
          const defaultIndex = churchIndex >= 0 ? churchIndex : 0;

          setSelectedOrganizationType(items[defaultIndex]._id);
          lastTriggeredIndex.current = defaultIndex;
        }
      } else if (__DEV__) {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      if (__DEV__) {
        console.log('saga error -- ', e.toString());
      }
    }
  }, [selectedOrganizationType, token]);

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

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
    listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);

      if (
        index !== lastTriggeredIndex.current &&
        index >= 0 &&
        index < organizationTypeItems.length
      ) {
        lastTriggeredIndex.current = index;
        setSelectedOrganizationType(organizationTypeItems[index].value);
        playSoundEffect('pickerClick', 0.025);
      }
    },
  });

  const renderItem = ({
    item,
    index,
  }: {
    item: { label: string; value: string };
    index: number;
  }) => {
    const inputRange = [(index - 1) * ITEM_HEIGHT, index * ITEM_HEIGHT, (index + 1) * ITEM_HEIGHT];

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
      <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
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
  };

  const selectedIndex = organizationTypeItems.findIndex(
    (item) => item.value === selectedOrganizationType
  );
  const initialScrollIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (selectedOrganizationType) {
          navigation.navigate('OnboardingOrganizationInfo', {
            selectedOrganizationType,
          });
        } else {
          toast.show('Organization type is required', {
            type: 'danger',
          });
        }
      }}
      onboardingType={AccountType.organization}
      activeStep={1}
      disabled={!selectedOrganizationType}
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
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
            What type of Organization are you?
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Identify your organization type
          </StyledText>
        </View>

        <View
          style={{
            flex: 4,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ translateY: pickerTranslateY }],
          }}
        >
          <View style={{ height: PICKER_HEIGHT, width: '100%' }}>
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

            {organizationTypeItems.length > 0 ? (
              <Animated.FlatList
                data={organizationTypeItems}
                keyExtractor={(item) => item.value}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                initialScrollIndex={initialScrollIndex}
                contentContainerStyle={{
                  paddingVertical: ITEM_HEIGHT,
                }}
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
              />
            ) : null}
          </View>
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingOrganizationType;

const styles = StyleSheet.create({
  selectionLine: {
    position: 'absolute',
    width: '60%',
    left: '20%',
    borderBottomWidth: 1,
    zIndex: -1,
  },
});
