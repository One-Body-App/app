import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Profile, People } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';

// import { ParamListBase } from '@react-navigation/native';s
import { MainStackParamList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import UserStepsLayout from '../layout/UserStepsLayout';
import { button } from '@/src/styles/buttons';
import { card } from '@/src/styles/items';
import { AccountType as AccountTypeType } from '@/utils/types';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { GeneralStyle } from '@/src/constants/GeneralStyle';

type Props = StackScreenProps<MainStackParamList, 'AccountType'>;

function AccountType({ route, navigation }: Props) {
  const [accountType, setAccountType] = useState<AccountTypeType | null>(null);
  const { dark, colors } = useTheme();

  return (
    <UserStepsLayout backgroundColor={Colors.neutral[700]}>
      <View style={{ flexGrow: 1, paddingHorizontal: 30, justifyContent: 'space-between' }}>
        <View>
          <StyledText style={[Typography.header.h1, { color: Colors.neutral[200], marginTop: 45 }]}>
            What account type best describes you?
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              { color: Colors.neutral[300], marginTop: 15, marginBottom: 25 },
            ]}
          >
            Get started on your experience in connecting with others. Let&#39;s setup your account
          </StyledText>

          <TouchableOpacity
            style={[
              card,
              {
                backgroundColor: Colors.main.white,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  backgroundColor: Colors.neutral[800],
                  borderRadius: borderRadius.base,
                  padding: spacing.x10,
                }}
              >
                <Profile color={Colors.primary.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <StyledText style={{ marginLeft: 15, ...Typography.body.x3 }}>
                  I am an Individual
                </StyledText>
                {accountType == AccountTypeType.individual ? (
                  <StyledText
                    style={{
                      marginLeft: 15,
                      marginRight: 5,
                      ...Typography.body.x2,
                      color: Colors.neutral[300],
                    }}
                  >
                    Individual profiles are for individuals, leaders, or any one person that desires
                    to create a One Body profile.
                  </StyledText>
                ) : null}
              </View>
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
                backgroundColor: Colors.main.white,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  backgroundColor: Colors.neutral[800],
                  borderRadius: borderRadius.base,
                  padding: 10,
                }}
              >
                <People color={Colors.primary.brand} />
              </View>

              <View style={{ flex: 1 }}>
                <StyledText style={{ marginLeft: 15, ...Typography.body.x3 }}>
                  We are an Organization
                </StyledText>
                {accountType == AccountTypeType.organization ? (
                  <StyledText
                    style={{
                      marginLeft: 15,
                      marginRight: 5,
                      ...Typography.body.x2,
                      color: Colors.neutral[300],
                    }}
                  >
                    Organization accounts are for Churches, Non-Profits, Businesses, or any
                    Christian entities that desire to create a One Body profile.
                  </StyledText>
                ) : null}
              </View>
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
        <View style={{ marginVertical: spacing.x24 }}>
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
            style={{ flexDirection: 'row', alignSelf: 'center' }}
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
}
export default AccountType;
