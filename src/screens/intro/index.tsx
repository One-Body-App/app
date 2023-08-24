import React from 'react';
import { RootNonUserStackParamList } from '@/src/navigator/types';
import { header, subheader } from '@/src/styles/typography';
import { StackScreenProps } from '@react-navigation/stack';
import {
  Image,
  SafeAreaView,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import UserStepsLayout from '../layout/UserStepsLayout';
import FastImage from 'react-native-fast-image';

type Props = StackScreenProps<RootNonUserStackParamList, 'Intro'>;

const IntroScreen = ({ route, navigation }: Props) => {
  return (
    <UserStepsLayout>
      <>
        <View style={{ flex: 4 }}>
          <FastImage
            resizeMode="cover"
            style={{ height: '100%', width: '100%' }}
            source={require('@/assets/images/introImage.jpg')}
          />
        </View>
        <View style={{ flex: 5 }}>
          <View
            style={{
              paddingTop: 60,
              justifyContent: 'space-between',
              flex: 1,
              flexDirection: 'column',
            }}
          >
            <View style={{ flex: 1, paddingBottom: 40 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  <Text style={[header.h2, { color: Colors.neutral.brand }]}>Welcome to </Text>
                  <Text style={[header.h2, { color: Colors.primarySapphire.brand }]}>OneBody</Text>
                </View>

                <View style={{ marginHorizontal: 50 }}>
                  <Text
                    style={[
                      subheader.M,
                      { color: Colors.neutral[200], textAlign: 'center', marginTop: 15 },
                    ]}
                  >
                    Connect with Christian leaders and social influencers from around the globe with
                    One Body Christian media and social platform
                  </Text>
                </View>
              </View>

              <View style={{ marginHorizontal: 20 }}>
                <TouchableOpacity
                  style={[button.primary, { marginBottom: 15 }]}
                  onPress={() => {
                    navigation.navigate('AccountType');
                  }}
                >
                  <Text style={{ color: '#FFF' }}>Create a free Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={button.outline}
                  onPress={() => {
                    navigation.navigate('Login');
                  }}
                >
                  <Text>I have an account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </>
    </UserStepsLayout>
  );
};

export default IntroScreen;
