import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { ScrollView, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@react-navigation/native';
import { MainStackParamList } from '@/src/navigator/types';
import { header, subheader } from '@/src/styles/typography';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import UserStepsLayout from '../layout/UserStepsLayout';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { spacing } from '@/src/styles/spacing';

type Props = StackScreenProps<MainStackParamList, 'Intro'>;

function IntroScreen({ route, navigation }: Props) {
  const { colors } = useTheme();

  return (
    <UserStepsLayout>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 0,
          flexBasis: 'auto',
        }}
      >
        <View
          style={{
            flexGrow: 1,
            flexShrink: 0,
            flexBasis: 300,
            marginTop: spacing.x32,
            paddingHorizontal: spacing.x16,
            height: 400,
          }}
        >
          <FastImage
            resizeMode="contain"
            style={{ height: '100%', width: '100%' }}
            // eslint-disable-next-line global-require
            source={require('@/assets/images/introImage.png')}
          />
        </View>
        <View style={{ flexGrow: 1, flexBasis: 400 }}>
          <View
            style={{
              paddingTop: 60,
              justifyContent: 'space-between',
              flex: 1,
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <View style={{ flex: 1, paddingBottom: 40 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  <StyledText
                    style={[header.h2, { color: Colors.neutral.brand, fontWeight: 'bold' }]}
                  >
                    Welcome to{' '}
                  </StyledText>
                  <StyledText
                    style={[header.h2, { color: Colors.primarySapphire.brand, fontWeight: 'bold' }]}
                  >
                    One Body
                  </StyledText>
                </View>

                <View style={{ marginHorizontal: 50 }}>
                  <StyledText
                    style={[
                      subheader.M,
                      { color: Colors.neutral[300], textAlign: 'center', marginTop: 15 },
                    ]}
                  >
                    Connect with Christian leaders and social influencers from around the globe with
                    One Body Christian media and social platform
                  </StyledText>
                </View>
              </View>

              <View style={{ marginHorizontal: spacing.x20, marginTop: spacing.x20 }}>
                <Button
                  btnStyle={[button.primary, { marginBottom: 15, flex: 1 }]}
                  onPress={() => {
                    navigation.navigate('AccountType');
                  }}
                  text="Create a free Account"
                  btnTextStyle={{ color: 'white' }}
                />

                <Button
                  btnStyle={[button.outline, { flex: 1 }]}
                  onPress={() => {
                    navigation.navigate('Login');
                  }}
                  text="I have an account"
                  btnTextStyle={{ color: colors.text }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </UserStepsLayout>
  );
}

export default IntroScreen;
