import React, { useEffect } from 'react';
import {
  Text,
  View,
  Linking,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  Switch,
  ActivityIndicator,
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
  Setting,
  Sms,
  SmsNotification,
  UserRemove,
} from 'iconsax-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/AntDesign';
import FastImage from 'react-native-fast-image';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/src/Services/constants';
import { ApiCall } from '@/src/Services/api';
import { setUserDataNotifications } from '@/src/Redux/actions/UserAction';
import { useToast } from 'react-native-toast-notifications';

type Props = DrawerScreenProps<SettingsStackParamsList, 'SettingsMain'>;

const Settings = ({ navigation }: Props) => {
  const GOOGLE_PACKAGE_NAME = '';
  const APPLE_STORE_ID = '';

  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [subscribedToNewsletter, setSubscribedToNewsletter] = React.useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = React.useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(false);
  const dispatch = useDispatch();
  const toast = useToast();

  const [isLoading, setIsLoading] = React.useState(false);

  const getUserProfile = async () => {
    // const toastId = toast.show(<ActivityIndicator color={colors.text} />, {
    //   id: 'loadig',
    //   placement: 'top',
    //   style: {
    //     backgroundColor: colors.background,
    //   },
    // });
    try {
      const res = await ApiCall({
        route: 'user/my-profile',
        token: token,
        verb: 'get',
      });

      if (res?.status == 200) {
        // dispatch(setProfile({ token, ...res.response }));
        setEmailNotificationsEnabled(res.response?.emailNotificationsEnabled ?? false);
        setPushNotificationsEnabled(res.response?.pushNotificationsEnabled ?? false);
        setSubscribedToNewsletter(res.response?.subscribedToNewsletter ?? false);

        // setIsLoaded(true);
        // toast.hide(toastId);
      } else {
        // toast.hide(toastId);
      }
    } catch (e) {
      // toast.hide(toastId);

      console.log(e);
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  const updateNotifications = async (
    pushNotificationsEnabled: boolean,
    subscribedToNewsletter: boolean,
    emailNotificationsEnabled: boolean
  ) => {
    const toastId = 'loading';
    toast.hide(toastId);
    toast.hide('successMessage');
    toast.show(<ActivityIndicator color={colors.text} />, {
      id: toastId,
      placement: 'top',
      style: {
        backgroundColor: colors.background,
      },
    });
    setIsLoading(true);
    try {
      const notifications = {
        pushNotificationsEnabled,
        subscribedToNewsletter,
        emailNotificationsEnabled,
      };

      const res = await ApiCall({
        params: notifications,
        route: `user/set-notifications`,
        token: token,
        verb: 'patch',
      });

      if (res?.status == 200) {
        dispatch(setUserDataNotifications({ notifications }));

        toast.show('Notifications Settings Updated Successfully', {
          id: 'successMessage',
          type: 'success',
          placement: 'top',
        });
      }
      toast.hide(toastId);
      setIsLoading(false);
    } catch (e) {
      toast.hide(toastId);
      setIsLoading(false);
      console.log(e);
    }
  };

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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {userProfile?.influencerProfile?.influencerStatus != 'approved' ? (
          <TouchableOpacity
            style={[
              styles.settingsCard,
              {
                padding: 0,
                paddingTop: spacing.x24,
                paddingBottom: spacing.x24,
                paddingLeft: spacing.x24,
                backgroundColor: '#D9D1FA',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
            onPress={() => {
              navigation.navigate('InfluencerStepOne');
            }}
          >
            <View style={{ flex: 1 }}>
              <StyledText style={[Typography.body.x4M, { color: Colors.primary[300], flex: 1 }]}>
                Get more from your account. Apply to become an influencer
              </StyledText>
            </View>
            <View style={{ flex: 1, flexDirection: 'column' }}>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <View style={{ flex: 1 }}></View>
                <View
                  style={{
                    backgroundColor: Colors.primarySapphire.brand,
                    paddingVertical: spacing.x5,
                    flex: 1,
                    borderStartStartRadius: borderRadius.base,
                    borderBottomStartRadius: borderRadius.base,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <StyledText style={[Typography.body.x2M, { color: 'white' }]}>Start</StyledText>
                  <Icon name="right" style={{ marginLeft: 10 }} color="white" />
                </View>
              </View>
              <View style={{ flex: 1, paddingHorizontal: spacing.x24 }}>
                <Image
                  resizeMode="contain"
                  resizeMethod="scale"
                  style={{
                    width: '100%',
                    aspectRatio: 1.77,
                    height: null,
                  }}
                  source={require('@/assets/images/influencerIntro.png')}
                />
              </View>
            </View>
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 3 }}>
          {userData?.tokenResult.signInProvider == 'password' ? (
            <View
              style={[
                styles.settingsCard,
                {
                  backgroundColor: colors.card,
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
              {userData?.tokenResult.signInProvider == 'password' ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ConfirmLogin', {
                      toScreen: 'EmailChange',
                      onlyPassword: true,
                    })
                  }
                  style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.x24,
                    }}
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
              ) : null}
              {userData?.tokenResult.signInProvider == 'password' ? (
                <TouchableOpacity
                  onPress={
                    () => {
                      navigation.navigate('ConfirmLogin', {
                        toScreen: 'PasswordChange',
                        onlyPassword: true,
                      });
                    }
                    // navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
                  }
                  style={{ flexDirection: 'row' }}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.x24,
                    }}
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
              ) : null}
            </View>
          ) : null}
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.card,
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
              onPress={
                () => {}
                // navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
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
                  Push Notifications
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Send notifications to phone
                </StyledText>
              </View>
              <View
                style={{
                  paddingLeft: spacing.x10,
                  flex: 1,
                  alignItems: 'flex-end',
                }}
              >
                <Switch
                  disabled={isLoading}
                  value={pushNotificationsEnabled}
                  onValueChange={(value) => {
                    setPushNotificationsEnabled(value);
                    updateNotifications(value, subscribedToNewsletter, emailNotificationsEnabled);
                  }}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={
                () => {}
                // navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
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
                  Email Notifications
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Send notifications to email
                </StyledText>
              </View>
              <View
                style={{
                  paddingLeft: spacing.x10,
                  flex: 1,
                  alignItems: 'flex-end',
                }}
              >
                <Switch
                  disabled={isLoading}
                  value={emailNotificationsEnabled}
                  onValueChange={(value) => {
                    setEmailNotificationsEnabled(value);
                    updateNotifications(pushNotificationsEnabled, value, emailNotificationsEnabled);
                  }}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={
                () => {}
                // navigation.navigate('ConfirmLogin', { toScreen: 'EmailChange', onlyPassword: true })
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
                  Subscribe to Newsletter
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Be updated with One Body
                </StyledText>
              </View>
              <View
                style={{
                  paddingLeft: spacing.x10,
                  flex: 1,
                  alignItems: 'flex-end',
                }}
              >
                <Switch
                  disabled={isLoading}
                  value={subscribedToNewsletter}
                  onValueChange={(value) => {
                    setSubscribedToNewsletter(value);
                    updateNotifications(pushNotificationsEnabled, subscribedToNewsletter, value);
                  }}
                />
              </View>
            </TouchableOpacity>
          </View>
          {userProfile?.influencerProfile?.influencerStatus == 'approved' ||
          userProfile?.influencerProfile?.influencerStatus == 'pending' ? (
            <View
              style={[
                styles.settingsCard,
                {
                  backgroundColor: colors.card,
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
                  Influencer
                </StyledText>
              </View>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('InfluencerSettings');
                }}
                style={{ flexDirection: 'row', marginBottom: spacing.x16 }}
              >
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.x24,
                  }}
                >
                  <View
                    style={{
                      borderRadius: borderRadius.max,
                      backgroundColor: Colors.neutral[800],
                      padding: 6,
                    }}
                  >
                    <Setting color={Colors.primary.brand} size={18} />
                  </View>
                </View>
                <View>
                  <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                    Influencer Settings
                  </StyledText>
                  <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                    Update your influencer profile settings
                  </StyledText>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: colors.card,
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
              onPress={() => navigation.navigate('RemoveAccount')}
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
                backgroundColor: colors.card,
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
              onPress={() => OpenURLButton('https://onebodyapp.com')}
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
              onPress={() => OpenURLButton(PRIVACY_POLICY_URL)}
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
              onPress={() => OpenURLButton(TERMS_CONDITIONS_URL)}
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
                  Terms of Use
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
                  Ensure your safety on One Body
                </StyledText>
              </View>
            </TouchableOpacity> */}

            <TouchableOpacity onPress={() => {}} style={{ flexDirection: 'row' }}>
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
        </View>
      </ScrollView>
    </View>
  );
};
export default Settings;
