import React from 'react';
import {
  Text,
  View,
  Linking,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { styles } from './styles';
import Header from '@/src/components/Header';
import { logout } from '@/redux/actions/AuthActions';
import { useDispatch, useSelector } from 'react-redux';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { LoginManager } from 'react-native-fbsdk-next';
import auth from '@react-native-firebase/auth';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/_Navigation/types';
import { useTheme } from '@react-navigation/native';
import GoBackIcon from '@/src/components/GoBackIcon';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { borderRadius } from '@/src/styles/outlines';
import { StyledText } from '@/src/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { Colors, Typography } from '@/src/styles';
import {
  CardRemove,
  InfoCircle,
  Key,
  Note,
  Note1,
  Notification,
  NotificationStatus,
  Sms,
  SmsNotification,
  UserRemove,
} from 'iconsax-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

type Props = DrawerScreenProps<SettingsStackParamsList, 'SettingsMain'>;

const Settings = ({ navigation }: Props) => {
  const GOOGLE_PACKAGE_NAME = '';
  const APPLE_STORE_ID = '';

  const dispatch = useDispatch();

  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
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
    <View
      style={{
        flex: 1,
        marginHorizontal: spacing.x24,
        paddingVertical: spacing.x16,
      }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {!userProfile?.isInfluencer ? (
          <View
            style={[
              styles.settingsCard,

              {
                backgroundColor: '#D9D1FA',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <StyledText style={[Typography.body.x4M, { flex: 1 }]}>
              Get more from your account. Apply to become an individual influencer{' '}
            </StyledText>
            <View style={{ flex: 1 }}></View>
          </View>
        ) : null}
        <View style={{ flex: 3 }}>
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: 'white',
              },
            ]}
          >
            <View>
              <StyledText
                style={[
                  Typography.header.h3,
                  { textTransform: 'uppercase', marginBottom: spacing.x16 },
                ]}
              >
                Security
              </StyledText>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Sms color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Update Email
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Change to a new email
                </StyledText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row' }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Key color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Update Password
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Change your password
                </StyledText>
              </View>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: 'white',
              },
            ]}
          >
            <View>
              <StyledText
                style={[
                  Typography.header.h3,
                  { textTransform: 'uppercase', marginBottom: spacing.x16 },
                ]}
              >
                Notifications
              </StyledText>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <NotificationStatus color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Update Email
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Change to a new email
                </StyledText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <SmsNotification color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Update Password
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Change your password
                </StyledText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row' }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Note1 color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Update Password
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Change your password
                </StyledText>
              </View>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: 'white',
              },
            ]}
          >
            <View>
              <StyledText
                style={[
                  Typography.header.h3,
                  { textTransform: 'uppercase', marginBottom: spacing.x16 },
                ]}
              >
                Advanced
              </StyledText>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.errorFeedback[400],
                    padding: 6,
                  }}
                >
                  <UserRemove color={Colors.errorFeedback[200]} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.errorFeedback[200] }]}>
                  Remove Account
                </StyledText>
              </View>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: 'white',
              },
            ]}
          >
            <View>
              <StyledText
                style={[
                  Typography.header.h3,
                  { textTransform: 'uppercase', marginBottom: spacing.x16 },
                ]}
              >
                One Body
              </StyledText>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Note color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  About
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Who we are
                </StyledText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Note color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Privacy Policy
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  How we collect and use data
                </StyledText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Note color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Terms of Service
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Terms of using One Body
                </StyledText>
              </View>
            </TouchableOpacity>

            {/* <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row' }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Note color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Safety Tips
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Ensure your safety on Onebody
                </StyledText>
              </View>
            </TouchableOpacity> */}

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
              }
              style={{ flexDirection: 'row' }}
            >
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Feather name="info" color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  App Version
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  1.0
                </StyledText>
              </View>
            </TouchableOpacity>
          </View>
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

          {userProfile?.influencerProfile?.influencerStatus == 'approved' ||
          userProfile?.influencerProfile?.influencerStatus == 'pending' ? (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('InfluencerSettings');
              }}
              style={{ ...styles.list, backgroundColor: colors.background }}
            >
              <View
                style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
              >
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
        </View>
      </ScrollView>
    </View>
  );
};
export default Settings;
