import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Pressable, View } from 'react-native';

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
import { navigateWithinCurrentNavigator } from '@/src/navigator/navigateWithinCurrentNavigator';
import { OnboardingStackParamList } from '@/src/navigator/types';
import {
  buildOrganizationCategoryGroups,
  OrganizationSubtypeOption,
} from '@/src/utils/organizationCategories';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationSubtype'>;

function SubtypeCard({
  item,
  isSelected,
  onPress,
  index,
  dark,
}: {
  item: OrganizationSubtypeOption;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  dark: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  useMountEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 280,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 280,
      friction: 20,
    }).start();
  };

  const unselectedCardStyle = dark ? styles.cardDark : styles.cardLight;
  const unselectedLabelStyle = dark ? styles.cardLabelDark : styles.cardLabelLight;
  const unselectedRadioStyle = dark ? styles.radioDark : styles.radioLight;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, isSelected ? styles.cardSelected : unselectedCardStyle]}
      >
        <StyledText
          style={[styles.cardLabel, isSelected ? styles.cardLabelSelected : unselectedLabelStyle]}
          numberOfLines={2}
        >
          {item.label}
        </StyledText>

        <View style={[styles.radio, isSelected ? styles.radioSelected : unselectedRadioStyle]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function OnboardingOrganizationSubtype({ navigation, route }: Props) {
  const { dark } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [organizationTypes, setOrganizationTypes] = useState<OrganizationType[]>([]);
  const [selectedOrganizationType, setSelectedOrganizationType] = useState<string>('');

  const { selectedOrganizationCategory } = route.params;

  const toast = useToast();

  const organizationCategoryGroups = useMemo(
    () => buildOrganizationCategoryGroups(organizationTypes),
    [organizationTypes]
  );

  const selectedCategoryGroup = useMemo(
    () =>
      organizationCategoryGroups.find((item) => item.value === selectedOrganizationCategory) ??
      null,
    [organizationCategoryGroups, selectedOrganizationCategory]
  );

  const subtypeItems = selectedCategoryGroup?.subtypes ?? [];
  const hasSubtypes = subtypeItems.length > 0;
  const hasLoadedTypes = organizationTypes.length > 0;

  const selectedOrganizationSubtype =
    subtypeItems.find((item) => item.organizationTypeId === selectedOrganizationType) ?? null;

  const getOrganizationTypes = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'global/OrganizationType',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        const types = res?.response as OrganizationType[];
        setOrganizationTypes(types);

        const groups = buildOrganizationCategoryGroups(types);
        const categoryGroup = groups.find((item) => item.value === selectedOrganizationCategory);
        if (categoryGroup && categoryGroup.subtypes.length > 0) {
          setSelectedOrganizationType(categoryGroup.subtypes[0].organizationTypeId);
        }
      } else if (__DEV__) {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      if (__DEV__) {
        console.log('saga error -- ', e.toString());
      }
    }
  }, [token, selectedOrganizationCategory]);

  useMountEffect(() => {
    if (token) {
      getOrganizationTypes();
    }
  });

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (!selectedOrganizationSubtype) {
          toast.show('Please select a subtype to continue', {
            type: 'danger',
          });
          return;
        }

        navigateWithinCurrentNavigator(navigation, 'OnboardingOrganizationInfo', {
          selectedOrganizationCategory,
          selectedOrganizationType: selectedOrganizationSubtype.organizationTypeId,
          selectedOrganizationSubType: selectedOrganizationSubtype.label,
        });
      }}
      onboardingType={AccountType.organization}
      activeStep={1}
      disabled={!selectedOrganizationSubtype}
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
          <View style={styles.categoryPill}>
            <StyledText style={styles.categoryPillText}>{selectedOrganizationCategory}</StyledText>
          </View>

          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
            Which best describes you?
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[300], marginTop: spacing.x5 }]}
          >
            Choose the subtype that fits your organization
          </StyledText>
        </View>

        {hasSubtypes && (
          <View style={styles.list}>
            {subtypeItems.map((item, index) => (
              <SubtypeCard
                key={item.organizationTypeId}
                item={item}
                isSelected={selectedOrganizationType === item.organizationTypeId}
                onPress={() => setSelectedOrganizationType(item.organizationTypeId)}
                index={index}
                dark={dark}
              />
            ))}
          </View>
        )}
        {!hasSubtypes && hasLoadedTypes && (
          <View style={styles.emptyState}>
            <StyledText
              style={[
                Typography.body.x1,
                { color: dark ? Colors.neutral[200] : Colors.neutral[300] },
              ]}
            >
              No subtypes are available for this category yet.
            </StyledText>
          </View>
        )}
      </View>
    </OnboardingStepsLayout>
  );
}

export default OnboardingOrganizationSubtype;

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.x20,
  },
  header: {
    marginBottom: spacing.x24,
    gap: spacing.x5,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.secondary.brand,
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x5,
    marginBottom: spacing.x8,
  },
  categoryPillText: {
    ...Typography.body.x2M,
    color: Colors.secondary.brand,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  list: {
    gap: spacing.x10,
    paddingBottom: spacing.x32,
  },
  cardWrapper: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: spacing.x20,
    paddingVertical: spacing.x17,
  },
  cardSelected: {
    backgroundColor: Colors.primary.brand,
    borderColor: Colors.primary.brand,
    boxShadow: '0 3px 6px rgba(18, 107, 135, 0.25)',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.neutral[600],
  },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  cardLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginRight: spacing.x16,
  },
  cardLabelSelected: {
    color: '#FFFFFF',
  },
  cardLabelLight: {
    color: Colors.primary.brand,
  },
  cardLabelDark: {
    color: Colors.neutral[200],
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: '#FFFFFF',
  },
  radioLight: {
    borderColor: Colors.neutral[500],
  },
  radioDark: {
    borderColor: 'rgba(255, 255, 255, 0.30)',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    paddingVertical: spacing.x32,
    alignItems: 'center',
  },
});
