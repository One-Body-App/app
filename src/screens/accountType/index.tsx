import React, { useEffect, useState } from 'react';
import { Text, View, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { setAccountType } from '@/redux//actions/GeneralActions';
import GradientHeader from '@/components/GradientHeader';
import Organization from '@/assets/svg/Organization.svg';
import Button from '@/components/Button';
import { styles } from './styles';

import GoBackIcon from '@/components/GoBackIcon';
import { StackScreenProps } from '@react-navigation/stack';
// import { ParamListBase } from '@react-navigation/native';
import { RootNonUserStackParamList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import UserStepsLayout from '../layout/UserStepsLayout';
import { fontWeight } from '@/src/styles/typography';
import { button } from '@/src/styles/buttons';
import { card } from '@/src/styles/items';

type Props = StackScreenProps<RootNonUserStackParamList, 'AccountType'>;

const AccountType = ({ route, navigation }: Props) => {
  const [accountType, setAccountType] = useState('');

  return (
    <UserStepsLayout backgroundColor="#F7F7F7">
      <View style={{ flex: 1, paddingHorizontal: 30, justifyContent: 'space-between' }}>
        <View>
          <Text style={[Typography.header.h1, { color: Colors.neutral.brand, marginTop: 45 }]}>
            What account type best describes you?
          </Text>
          <Text
            style={[
              Typography.subheader.R,
              { color: Colors.neutral[200], marginTop: 15, marginBottom: 25 },
            ]}
          >
            Get started on your experience in connecting with others. Let's setup your account
          </Text>

          <TouchableOpacity
            style={card}
            onPress={() => {
              navigation.navigate('AccountType');
            }}
          >
            <Text>I am an Individual</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={card}
            onPress={() => {
              navigation.navigate('AccountType');
            }}
          >
            <Text>We are an Organization</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={[button.primary, { marginBottom: 35 }]}
            onPress={() => {
              navigation.navigate('AccountType');
            }}
          >
            <Text style={{ color: '#FFF' }}>Continue</Text>
          </TouchableOpacity>
          <Text>Already have an account? Sign in</Text>
        </View>
      </View>
    </UserStepsLayout>
  );
};
export default AccountType;
