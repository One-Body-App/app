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

type Props = NativeStackScreenProps<RootStackParamList, 'RemoveAccount'>;

const RemoveAccount = ({ navigation }: Props) => {
  const [reason, setReason] = useState<string>('');
  const token = useSelector((state: RootState) => state.auth.userToken);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Remove account'}
        leftView={
          <Ionicons onPress={() => navigation.goBack()} name="chevron-back-outline" size={20} />
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <Text style={styles.heading}>You will be missed</Text>
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
                ? { backgroundColor: '#032F3C' }
                : {
                    backgroundColor: 'white',
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
                ? { backgroundColor: '#032F3C' }
                : {
                    backgroundColor: 'white',
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
                ? { backgroundColor: '#032F3C' }
                : {
                    backgroundColor: 'white',
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
                ? { backgroundColor: '#032F3C' }
                : {
                    backgroundColor: 'white',
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
        <View>
          <Button
            text={'REMOVE ACCOUNT'}
            btnStyle={{
              ...GeneralStyle.btn,
              width: getWidth(85),
              backgroundColor: 'red',
            }}
            disabled={!reason}
            btnTextStyle={GeneralStyle.btnText}
            disabledBtnStyle={{
              ...GeneralStyle.btn,
              width: getWidth(85),
              backgroundColor: '#F6F6F6',
            }}
            disabledBtnTextStyle={{ ...GeneralStyle.btnText, color: '#81979E' }}
            onPress={() => {
              navigation.navigate('ConfirmLogin', {
                toScreen: 'RemoveAccountConfirmation',

                onlyPassword: true,
                toScreenRouteParams: {
                  reason,
                },
              });
            }}
          />
          <Button
            text={'Cancel'}
            onPress={() => navigation.goBack()}
            btnStyle={{ ...styles.btn, backgroundColor: 'white' }}
            btnTextStyle={{ ...styles.btnText, color: '#126B87', fontSize: 14 }}
          />
        </View>
      </View>
    </View>
  );
};
export default RemoveAccount;
