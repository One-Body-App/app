import React from 'react';
import { Text, View, Linking, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { styles } from './styles';
import Header from '@/components/Header';
import { logout } from '@/redux//actions/AuthActions';
import { useDispatch, useSelector } from 'react-redux';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { LoginManager } from 'react-native-fbsdk-next';
import auth from '@react-native-firebase/auth';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

const Settings = ({ navigation }: Props) => {
  const GOOGLE_PACKAGE_NAME = '';
  const APPLE_STORE_ID = '';

  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.auth.userProfile);
  const startRatingCounter = () => {
    Alert.alert(
      'Rate us',
      'Would you like to share your review with us?',

      [
        { text: 'Sure', onPress: () => openStore() },
        {
          text: 'No Thanks!',

          onPress: () => console.log('No Thanks Pressed'),
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  };
  const openStore = () => {
    //This is the main trick
    if (Platform.OS != 'ios') {
      Linking.openURL(`market://details?id=${GOOGLE_PACKAGE_NAME}`).catch((err) =>
        // alert('Please check for Google Play Store')
        Alert.alert('Please check for Google Play Store')
      );
    } else {
      Linking.openURL(`itms://itunes.apple.com/in/app/apple-store/${APPLE_STORE_ID}`).catch((err) =>
        // alert('Please check for the App Store' + err)
        Alert.alert('Please check for the App Store')
      );
    }
  };

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Settings'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <ScrollView style={styles.innerContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange' })}
          style={styles.list}
        >
          <View>
            <Text style={styles.heading}>Email</Text>
            <Text style={{ color: '#70747D' }}>Update email address</Text>
          </View>
          <AntDesign name="right" size={20} color={'#70747D'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('ConfirmLogin', { toScreen: 'PasswordChange' })}
          style={styles.list}
        >
          <View>
            <Text style={styles.heading}>Password</Text>
            <Text style={{ color: '#70747D' }}>Change Password</Text>
          </View>
          <AntDesign name="right" size={20} color={'#70747D'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationsAndEmail')}
          style={styles.list}
        >
          <View>
            <Text style={styles.heading}>Notifications Settings</Text>
          </View>
          <AntDesign name="right" size={20} color={'#70747D'} />
        </TouchableOpacity>

        {user?.isInfluencer == true ? null : (
          <TouchableOpacity
            onPress={() => {
              user?.isInfluencer == true
                ? Alert.alert('You Already a Influencer')
                : navigation.navigate('InfluencerStepOne');
            }}
            style={styles.list}
          >
            <Text style={styles.heading}>Become an influencer</Text>

            <AntDesign name="right" size={20} color={'#70747D'} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('RemoveAccount')} style={styles.list}>
          <Text
            style={{
              ...styles.heading,
              color: 'red',
            }}
          >
            Remove account
          </Text>

          <AntDesign name="right" color={'red'} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            LoginManager.logOut();
            auth().signOut();
            dispatch(logout());
          }}
          style={{ ...styles.lists, marginBottom: 10, borderBottomWidth: 0 }}
        >
          <Text style={styles.logouttext}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
export default Settings;
