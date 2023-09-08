import React, { useEffect, useState } from 'react';
import { Text, View, Image, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { setAccountType } from '@/redux//actions/GeneralActions';
import GradientHeader from '@/src/components/GradientHeader';
import Organization from '@/assets/svg/Organization.svg';
import Button from '@/src/components/Button';

import GoBackIcon from '@/src/components/GoBackIcon';
import { StackScreenProps } from '@react-navigation/stack';
// import { ParamListBase } from '@react-navigation/native';
import { RootNonUserStackParamList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import UserStepsLayout from '../layout/UserStepsLayout';
import { fontWeight } from '@/src/styles/typography';
import { button } from '@/src/styles/buttons';
import { card } from '@/src/styles/items';
import { Profile, People } from 'iconsax-react-native';
import { AccountType as AccountTypeType } from '@/utils/types';
import { useTheme } from '@react-navigation/native';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { GeneralStyle } from '@/src/constants/GeneralStyle';

type Props = StackScreenProps<RootNonUserStackParamList, 'AccountType'>;

const AccountType = ({ route, navigation }: Props) => {
  const [accountType, setAccountType] = useState<AccountTypeType | null>(null);
  const { dark, colors } = useTheme();

  return (
    <UserStepsLayout backgroundColor={dark ? colors.background : Colors.neutral[700]}>
      <View style={{ flex: 1, paddingHorizontal: 30, justifyContent: 'space-between' }}>
        <View>
          <Text style={[Typography.header.h1, { color: Colors.neutral[200], marginTop: 45 }]}>
            What account type best describes you?
          </Text>
          <Text
            style={[
              Typography.subheader.R,
              { color: Colors.neutral[300], marginTop: 15, marginBottom: 25 },
            ]}
          >
            Get started on your experience in connecting with others. Let's setup your account
          </Text>

          <TouchableOpacity
            style={[
              card,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor:
                  accountType == AccountTypeType.individual
                    ? Colors.primarySapphire.brand
                    : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setAccountType(AccountTypeType.individual);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: Colors.neutral[800],
                  borderRadius: borderRadius.card,
                  padding: spacing.x10,
                }}
              >
                <Profile color={Colors.primary.brand} />
              </View>
              <Text style={{ marginLeft: 15 }}>I am an Individual</Text>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    accountType == AccountTypeType.individual
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[200],
                },
              ]}
            >
              {accountType == AccountTypeType.individual ? (
                <View style={GeneralStyle.radioButtonIcon} />
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              card,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor:
                  accountType == AccountTypeType.organization
                    ? Colors.primarySapphire.brand
                    : Colors.neutral[800],
              },
            ]}
            onPress={() => {
              setAccountType(AccountTypeType.organization);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: Colors.neutral[800],
                  borderRadius: borderRadius.card,
                  padding: 10,
                }}
              >
                <People color={Colors.primary.brand} />
              </View>

              <Text style={{ marginLeft: 15 }}>We are an Organization</Text>
            </View>
            <View
              style={[
                GeneralStyle.radioButton,
                {
                  borderColor:
                    accountType == AccountTypeType.organization
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[200],
                },
              ]}
            >
              {accountType == AccountTypeType.organization ? (
                <View style={GeneralStyle.radioButtonIcon} />
              ) : null}
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={[
              button.primary,
              {
                marginBottom: 35,
                opacity: accountType == null ? 0.4 : 1,
              },
            ]}
            disabled={accountType == null}
            onPress={() => {
              if (accountType) navigation.navigate('SignUp', { accountType });
            }}
          >
            <StyledText style={{ color: '#FFF' }}>Continue</StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row' }}
            onPress={() => {
              navigation.replace('Login');
            }}
          >
            <StyledText>Already have an account? </StyledText>
            <StyledText style={{ color: Colors.primarySapphire.brand }}>Sign in</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </UserStepsLayout>
  );
};
export default AccountType;
