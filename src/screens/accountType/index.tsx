import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  InteractionManager,
  useWindowDimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Profile, People } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';

import { MainStackParamList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import UserStepsLayout from '../layout/UserStepsLayout';
import { button } from '@/src/styles/buttons';
import { card } from '@/src/styles/items';
import { AccountType as AccountTypeType } from '@/utils/types';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import GeneralStyle from '@/src/constants/GeneralStyle';
import { savePendingAccountType } from '@/src/services/accountTypeStorage';

type Props = StackScreenProps<MainStackParamList, 'AccountType'>;

const CONTENT_MAX_WIDTH = 720;

function AccountType({ navigation }: Props) {
  const [accountType, setAccountType] = useState<AccountTypeType | null>(null);
  const { colors, dark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const primaryTextColor = dark ? '#f6f6f6' : Colors.primary.brand;

  const individualAnim = useRef(new Animated.Value(0)).current;
  const organizationAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const optionOneAnim = useRef(new Animated.Value(0)).current;
  const optionTwoAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  const dropShadow = {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  };

  const animateSelection = (type: AccountTypeType) => {
    setAccountType(type);
    const targetIndividual = type === AccountTypeType.individual ? 1 : 0;
    const targetOrganization = type === AccountTypeType.organization ? 1 : 0;

    Animated.parallel([
      Animated.spring(individualAnim, {
        toValue: targetIndividual,
        friction: 7,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.spring(organizationAnim, {
        toValue: targetOrganization,
        friction: 7,
        tension: 70,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const cardAnimatedStyle = (anim: Animated.Value, selected: boolean) => ({
    backgroundColor: colors.card,
    justifyContent: 'space-between' as const,
    alignItems: 'stretch' as const,
    borderWidth: 1,
    borderColor: selected ? Colors.secondary.brand : Colors.primary.brand,
    height: anim.interpolate({ inputRange: [0, 1], outputRange: [110, 200] }),
    transform: [
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-3, 0] }),
      },
    ],
    ...dropShadow,
  });

  const descriptionAnimatedStyle = (anim: Animated.Value) => ({
    opacity: anim,
    maxHeight: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
  });

  const fadeUp = (anim: Animated.Value, distance = 18) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }),
      },
    ],
  });

  const optionEntryStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.7, 1] }),
    transform: [
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
      },
      {
        rotate: anim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: ['8deg', '-5deg', '0deg'],
        }),
      },
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
      },
    ],
  });

  useEffect(() => {
    let task: ReturnType<typeof InteractionManager.runAfterInteractions> | undefined;

    if (!hasAnimated.current) {
      task = InteractionManager.runAfterInteractions(() => {
        hasAnimated.current = true;

        const playWobble = (anim: Animated.Value) =>
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0.9,
              duration: 120,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.spring(anim, {
              toValue: 1,
              friction: 6,
              tension: 90,
              useNativeDriver: false,
            }),
          ]);

        Animated.sequence([
          Animated.timing(headerAnim, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(cardsAnim, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(footerAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.stagger(120, [playWobble(optionOneAnim), playWobble(optionTwoAnim)]),
        ]).start();
      });
    }

    return () => {
      if (task) {
        task.cancel();
      }
    };
  }, [cardsAnim, footerAnim, headerAnim, optionOneAnim, optionTwoAnim]);

  return (
    <UserStepsLayout backgroundColor={colors.background} showCustomHeaderOnAndroid>
      <View
        style={{
          flex: 1,
          flexGrow: 1,
          paddingHorizontal: 30,
          justifyContent: 'space-between',
          alignItems: isTablet ? 'center' : undefined,
        }}
      >
        <View
          style={{
            width: isTablet ? '100%' : undefined,
            maxWidth: isTablet ? CONTENT_MAX_WIDTH : undefined,
          }}
        >
          <Animated.View style={fadeUp(headerAnim, 12)}>
            <StyledText style={[Typography.header.h1, { color: primaryTextColor, marginTop: 45 }]}>
              What account type best describes you?
            </StyledText>
            <StyledText
              style={[
                Typography.subheader.R,
                { color: primaryTextColor, marginTop: 10, marginBottom: 5 },
              ]}
            >
              Get started on your experience in connecting with others. Let&#39;s setup your account
            </StyledText>
          </Animated.View>

          <Animated.View
            style={[
              card,
              cardAnimatedStyle(individualAnim, accountType === AccountTypeType.individual),
              optionEntryStyle(optionOneAnim),
              fadeUp(cardsAnim, 10),
            ]}
          >
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 10 }}
              activeOpacity={0.9}
              onPress={() => animateSelection(AccountTypeType.individual)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: accountType === AccountTypeType.individual ? 'flex-start' : 'center',
                  flex: 1,
                }}
              >
                <View
                  style={{
                    backgroundColor: Colors.neutral[800],
                    borderRadius: borderRadius.base,
                    padding: spacing.x10,
                    height: 40,
                    width: 40,
                    alignSelf: accountType === AccountTypeType.individual ? 'flex-start' : 'center',
                    marginTop: -2,
                  }}
                >
                  <Profile color={Colors.primary.brand} />
                </View>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <StyledText
                    style={{
                      marginLeft: 10,
                      ...Typography.body.x3,
                      color: primaryTextColor,
                      fontWeight: '700',
                    }}
                  >
                    I am an Individual
                  </StyledText>
                  <Animated.View
                    style={[descriptionAnimatedStyle(individualAnim), { marginTop: 6 }]}
                  >
                    <StyledText
                      style={{
                        marginLeft: 10,
                        marginRight: 8,
                        ...Typography.body.x2,
                        color: primaryTextColor,
                      }}
                    >
                      Individual profiles are for individuals, leaders, or any one person that
                      desires to create a One Body profile.
                    </StyledText>
                  </Animated.View>
                </View>
              </View>
              <View
                style={[
                  GeneralStyle.radioButton,
                  {
                    borderColor:
                      accountType === AccountTypeType.individual
                        ? Colors.secondary.brand
                        : Colors.primary.brand,
                  },
                ]}
              >
                {accountType === AccountTypeType.individual ? (
                  <View style={GeneralStyle.radioButtonIcon} />
                ) : null}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              card,
              cardAnimatedStyle(organizationAnim, accountType === AccountTypeType.organization),
              optionEntryStyle(optionTwoAnim),
              fadeUp(cardsAnim, 10),
            ]}
          >
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 10 }}
              activeOpacity={0.9}
              onPress={() => animateSelection(AccountTypeType.organization)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems:
                    accountType === AccountTypeType.organization ? 'flex-start' : 'center',
                  flex: 1,
                }}
              >
                <View
                  style={{
                    backgroundColor: Colors.neutral[800],
                    borderRadius: borderRadius.base,
                    padding: 10,
                    height: 40,
                    width: 40,
                    alignSelf:
                      accountType === AccountTypeType.organization ? 'flex-start' : 'center',
                    marginTop: -2,
                  }}
                >
                  <People color={Colors.primary.brand} />
                </View>

                <View style={{ flex: 1, paddingRight: 10 }}>
                  <StyledText
                    style={{
                      marginLeft: 10,
                      ...Typography.body.x3,
                      color: primaryTextColor,
                      fontWeight: '700',
                    }}
                  >
                    We are an Organization
                  </StyledText>
                  <Animated.View
                    style={[descriptionAnimatedStyle(organizationAnim), { marginTop: 6 }]}
                  >
                    <StyledText
                      style={{
                        marginLeft: 10,
                        marginRight: 8,
                        ...Typography.body.x2,
                        color: primaryTextColor,
                      }}
                    >
                      Organization accounts are for Churches, Non-Profits, Businesses, or any
                      Christian entities that desire to create a One Body profile.
                    </StyledText>
                  </Animated.View>
                </View>
              </View>
              <View
                style={[
                  GeneralStyle.radioButton,
                  {
                    borderColor:
                      accountType === AccountTypeType.organization
                        ? Colors.secondary.brand
                        : Colors.primary.brand,
                  },
                ]}
              >
                {accountType === AccountTypeType.organization ? (
                  <View style={GeneralStyle.radioButtonIcon} />
                ) : null}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Animated.View
          style={[
            {
              marginVertical: spacing.x24,
              width: isTablet ? '100%' : undefined,
              maxWidth: isTablet ? CONTENT_MAX_WIDTH : undefined,
            },
            fadeUp(footerAnim, 10),
          ]}
        >
          <TouchableOpacity
            style={[
              button.primary,
              {
                marginBottom: 35,
                opacity: accountType == null ? 0.4 : 1,
                ...dropShadow,
              },
            ]}
            disabled={accountType == null}
            onPress={async () => {
              if (!accountType) {
                return;
              }
              await savePendingAccountType(accountType);
              navigation.navigate('SignUp', { accountType });
            }}
          >
            <StyledText style={{ color: '#FFF' }}>Continue</StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignSelf: 'center' }}
            onPress={() => {
              navigation.replace('Login');
            }}
          >
            <StyledText style={{ color: primaryTextColor }}>Already have an account? </StyledText>
            <StyledText style={{ color: Colors.secondary.brand }}>Sign in</StyledText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </UserStepsLayout>
  );
}

export default AccountType;
