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
import { useTheme } from '@react-navigation/native';
import GoBackIcon from '@/src/Components/GoBackIcon';
import { DrawerScreenProps } from '@react-navigation/drawer';

type Props = DrawerScreenProps<RootStackParamList, 'Settings'>;

const Settings = ({ navigation }: Props) => {
  const GOOGLE_PACKAGE_NAME = '';
  const APPLE_STORE_ID = '';

  const dispatch = useDispatch();

  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const userData = useSelector((state: RootState) => state.auth.userData);
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

  const time = new Date().getTime() / 1000;
  let showInfluencerNotification = false;

  if (
    userProfile?.influencerProfile?.instagramId &&
    userProfile?.influencerProfile?.instagramTokenExpirationReal &&
    userProfile?.influencerProfile?.instagramTokenExpirationReal < time &&
    !showInfluencerNotification
  ) {
    showInfluencerNotification =
      userProfile?.influencerProfile?.instagramTokenExpirationReal < time;
  }

  if (
    userProfile?.influencerProfile?.twitterId &&
    userProfile?.influencerProfile?.twitterTokenExpirationReal &&
    userProfile?.influencerProfile?.twitterTokenExpirationReal < time &&
    !showInfluencerNotification
  ) {
    showInfluencerNotification = userProfile?.influencerProfile?.twitterTokenExpirationReal < time;
  }

  const { colors, dark } = useTheme();

  return (
    <View style={styles.container}>
      <GeneralStatusBar backgroundColor={colors.background} hidden={false} translucent={true} />

      <Header
        title={'Settings'}
        leftView={
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <ScrollView style={styles.innerContainer}>
        {userData?.tokenResult.signInProvider == 'password' ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
            }
            style={{ ...styles.list, backgroundColor: colors.background }}
          >
            <View>
              <Text style={{ ...styles.heading, color: dark ? colors.text : '#032F3C' }}>
                Email
              </Text>
              <Text style={{ color: '#70747D' }}>Update email address</Text>
            </View>
            <AntDesign name="right" size={20} color={'#70747D'} />
          </TouchableOpacity>
        ) : null}

        {userData?.tokenResult.signInProvider == 'password' ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ConfirmLogin', {
                toScreen: 'PasswordChange',
                onlyPassword: true,
              })
            }
            style={{ ...styles.list, backgroundColor: colors.background }}
          >
            <View>
              <Text style={{ ...styles.heading, color: dark ? colors.text : '#032F3C' }}>
                Password
              </Text>
              <Text style={{ color: '#70747D' }}>Change Password</Text>
            </View>
            <AntDesign name="right" size={20} color={'#70747D'} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationSettings')}
          style={{ ...styles.list, backgroundColor: colors.background }}
        >
          <View>
            <Text style={{ ...styles.heading, color: dark ? colors.text : '#032F3C' }}>
              Notifications Settings
            </Text>
          </View>
          <AntDesign name="right" size={20} color={'#70747D'} />
        </TouchableOpacity>

        {userProfile?.influencerProfile?.influencerStatus == 'approved' ? (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('InfluencerSettings');
            }}
            style={{ ...styles.list, backgroundColor: colors.background }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ ...styles.heading, color: dark ? colors.text : '#032F3C' }}>
                Influencer Settings
              </Text>
              {showInfluencerNotification ? (
                <View
                  style={{
                    backgroundColor: 'red',
                    width: 8,
                    height: 8,
                    borderRadius: 8,
                    marginLeft: 8,
                  }}
                />
              ) : null}
            </View>

            <AntDesign name="right" size={20} color={'#70747D'} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              userProfile?.isInfluencer == true
                ? Alert.alert('You Already a Influencer')
                : navigation.navigate('InfluencerStepOne');
            }}
            style={{ ...styles.list, backgroundColor: colors.background }}
          >
            <Text style={{ ...styles.heading, color: dark ? colors.text : '#032F3C' }}>
              Become an influencer
            </Text>

            <AntDesign name="right" size={20} color={'#70747D'} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('RemoveAccount')}
          style={{ ...styles.list, backgroundColor: colors.background }}
        >
          <Text
            style={{
              ...{ ...styles.heading, color: dark ? colors.text : '#032F3C' },
              color: 'red',
            }}
          >
            Remove account
          </Text>

          <AntDesign name="right" color={'red'} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            LoginManager.logOut();
            dispatch(logout());

            await auth().signOut();
          }}
          style={{
            ...styles.list,
            backgroundColor: colors.background,
            marginBottom: 10,
            borderBottomWidth: 0,
          }}
        >
          <Text style={{ ...styles.logouttext, color: dark ? colors.text : '#032F3C' }}>
            Log out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
export default Settings;
