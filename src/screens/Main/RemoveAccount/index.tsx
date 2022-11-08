import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';
import { useSelector } from 'react-redux';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { useTheme } from '@react-navigation/native';
import { setLoginVerificationBackPage } from '@/src/Redux/actions/GeneralActions';

type Props = NativeStackScreenProps<RootStackParamList, 'RemoveAccount'>;

const RemoveAccount = ({ navigation }: Props) => {
  const [reason, setReason] = useState<string>('');
  const token = useSelector((state: RootState) => state.auth.userToken);

  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <GeneralStatusBar backgroundColor={colors.background} hidden={false} />

      <Header
        title={'Remove account'}
        leftView={
          <Ionicons
            onPress={() => navigation.goBack()}
            name="chevron-back-outline"
            color={colors.primary}
            size={20}
          />
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <Text style={{ ...styles.heading, color: colors.text }}>You will be missed</Text>
        <Text style={styles.text}>
          We are sorry to see you go. Removing your account will erase all of the data we have
          stored about you and there is
          <Text style={{ color: '#E90202' }}> no recovery.</Text> Please spare a moment to let us
          know why you are leaving?
        </Text>
        <View style={{ margin: getHeight(5) }}>
          <Button
            text={'Could not find content relevant to my faith'}
            onPress={() => setReason('Could not find content relevant to my faith')}
            btnStyle={[
              styles.btn,
              reason == 'Could not find content relevant to my faith'
                ? { backgroundColor: colors.primary }
                : {
                    backgroundColor: colors.card,
                    borderWidth: 0.5,
                    borderColor: 'gray',
                  },
            ]}
            btnTextStyle={[
              styles.btnText,
              reason == 'Could not find content relevant to my faith'
                ? { color: 'white', fontSize: getFontSize(2) }
                : { color: '#757575', fontSize: getFontSize(2) },
            ]}
          />
          <Button
            text={'I do not use OneBody enough'}
            onPress={() => setReason('I do not use OneBody enough')}
            btnStyle={[
              styles.btn,
              reason == 'I do not use OneBody enough'
                ? { backgroundColor: colors.primary }
                : {
                    backgroundColor: colors.card,
                    borderWidth: 0.5,
                    borderColor: 'gray',
                  },
            ]}
            btnTextStyle={[
              styles.btnText,
              reason == 'I do not use OneBody enough'
                ? { color: 'white', fontSize: getFontSize(2) }
                : { color: '#757575', fontSize: getFontSize(2) },
            ]}
          />
          <Button
            text={'I have found too many bugs in the app'}
            onPress={() => setReason('I have found too many bugs in app')}
            btnStyle={[
              styles.btn,
              reason == 'I have found too many bugs in app'
                ? { backgroundColor: colors.primary }
                : {
                    backgroundColor: colors.card,
                    borderWidth: 0.5,
                    borderColor: 'gray',
                  },
            ]}
            btnTextStyle={[
              styles.btnText,
              reason == 'I have found too many bugs in app'
                ? { color: 'white', fontSize: getFontSize(2) }
                : { color: '#757575', fontSize: getFontSize(2) },
            ]}
          />
          <Button
            text={'App consumes a lot of battery'}
            onPress={() => setReason('App consume a lot of battery')}
            btnStyle={[
              styles.btn,
              reason == 'App consume a lot of battery'
                ? { backgroundColor: colors.primary }
                : {
                    backgroundColor: colors.card,
                    borderWidth: 0.5,
                    borderColor: 'gray',
                  },
            ]}
            btnTextStyle={[
              styles.btnText,
              reason == 'App consume a lot of battery'
                ? { color: 'white', fontSize: getFontSize(2) }
                : { color: '#757575', fontSize: getFontSize(2) },
            ]}
          />
        </View>
        <View style={{ width: '100%' }}>
          <Button
            text={'REMOVE ACCOUNT'}
            btnStyle={{
              ...GeneralStyle.btn,

              backgroundColor: 'red',
            }}
            disabled={!reason}
            btnTextStyle={GeneralStyle.btnText}
            disabledBtnStyle={{
              ...GeneralStyle.btn,

              backgroundColor: colors.card,
            }}
            disabledBtnTextStyle={{ ...GeneralStyle.btnText, color: '#81979E' }}
            onPress={() => {
              navigation.navigate('ConfirmLogin', {
                toScreen: 'RemoveAccountConfirmation' as keyof RootStackParamList,

                toScreenRouteParams: {
                  reason,
                },
              });
            }}
          />
          <Button
            text={'Cancel'}
            onPress={() => navigation.goBack()}
            btnStyle={{ ...GeneralStyle.btn, backgroundColor: colors.background }}
            btnTextStyle={{ ...styles.btnText, color: colors.text, fontSize: 14 }}
          />
        </View>
      </View>
    </View>
  );
};
export default RemoveAccount;
