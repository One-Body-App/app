import React, { useCallback } from 'react';
import { View, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import {
  Key,
  Note,
  Note1,
  NotificationStatus,
  Setting,
  Sms,
  SmsNotification,
  UserRemove,
} from 'iconsax-react-native';
import Feather from '@react-native-vector-icons/feather';
import { useToast } from 'react-native-toast-notifications';
import DeviceInfo from 'react-native-device-info';
import styles from './styles';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { borderRadius } from '@/src/styles/outlines';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { Colors, Typography } from '@/src/styles';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/services/constants';
import { ApiCall } from '@/services/api';
import { setUserDataNotifications } from '@/src/redux/actions/UserAction';
import {
  disablePushNotifications,
  enablePushNotifications,
} from '@/src/services/notification/pushNotificationService';
import {
  isSecureMessagePreviewEnabled,
  setSecureMessagePreviewEnabled,
} from '@/src/services/chat/backgroundHandler';
import { getCreatorMenuLabel, getCreatorMenuState } from '@/src/utils/creatorApplication';

type Props = DrawerScreenProps<SettingsStackParamsList, 'SettingsMain'>;

function Settings({ navigation }: Props) {
  const appVersion = DeviceInfo.getVersion();

  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [subscribedToNewsletter, setSubscribedToNewsletter] = React.useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = React.useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = React.useState(false);
  const [allowDirectMessages, setAllowDirectMessages] = React.useState(true);
  const [securePreviewEnabled, setSecurePreviewEnabledState] = React.useState(false);
  const [isSecurePreviewLoading, setIsSecurePreviewLoading] = React.useState(true);
  const dispatch = useDispatch();
  const toast = useToast();

  const [isLoading, setIsLoading] = React.useState(false);

  const updateSecurePreview = async (enabled: boolean) => {
    setSecurePreviewEnabledState(enabled);
    try {
      await setSecureMessagePreviewEnabled(enabled);
      toast.hide('securePreviewMessage');
      toast.show(
        enabled ? 'Secure lock-screen previews enabled' : 'Secure lock-screen previews disabled',
        {
          id: 'securePreviewMessage',
          type: 'normal',
          placement: 'top',
        }
      );
    } catch {
      const fallback = await isSecureMessagePreviewEnabled();
      setSecurePreviewEnabledState(fallback);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

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
            token,
            verb: 'get',
          });

          if (!isActive || res?.status !== 200) {
            return;
          }

          // dispatch(setProfile({ token, ...res.response }));
          setEmailNotificationsEnabled(res.response?.emailNotificationsEnabled ?? false);
          setPushNotificationsEnabled(res.response?.pushNotificationsEnabled ?? false);
          setSubscribedToNewsletter(res.response?.subscribedToNewsletter ?? false);
          setAllowDirectMessages(res.response?.allowDirectMessages ?? true);

          // setIsLoaded(true);
          // toast.hide(toastId);
        } catch (e) {
          // toast.hide(toastId);
        }
      };

      const loadSecurePreviewPreference = async () => {
        try {
          const enabled = await isSecureMessagePreviewEnabled();
          if (!isActive) {
            return;
          }
          setSecurePreviewEnabledState(enabled);
        } finally {
          if (isActive) {
            setIsSecurePreviewLoading(false);
          }
        }
      };

      getUserProfile();
      loadSecurePreviewPreference();

      return () => {
        isActive = false;
      };
    }, [token])
  );

  const updateNotifications = async (
    nextPushNotificationsEnabled: boolean,
    nextSubscribedToNewsletter: boolean,
    nextEmailNotificationsEnabled: boolean,
    nextAllowDirectMessages: boolean
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
        pushNotificationsEnabled: nextPushNotificationsEnabled,
        subscribedToNewsletter: nextSubscribedToNewsletter,
        emailNotificationsEnabled: nextEmailNotificationsEnabled,
        allowDirectMessages: nextAllowDirectMessages,
      };

      const res = await ApiCall({
        params: notifications,
        route: `user/set-notifications`,
        token,
        verb: 'patch',
      });

      if (res?.status === 200) {
        dispatch(setUserDataNotifications({ notifications }));

        if (nextPushNotificationsEnabled) {
          await enablePushNotifications(token, true);
        } else {
          await disablePushNotifications(token);
        }

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
    }
  };

  const { colors } = useTheme();
  const creatorStatus = userProfile?.influencerProfile?.influencerStatus;
  const creatorMenuState = getCreatorMenuState(creatorStatus);
  const creatorMenuLabel = getCreatorMenuLabel(creatorStatus);
  const creatorMenuDescription =
    creatorMenuState === 'settings'
      ? 'Update your creator profile settings'
      : 'Apply to share your content on One Body';

  return (
    <View
      style={{
        flex: 1,
        marginHorizontal: spacing.x24,
        paddingBottom: spacing.x16,
      }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 3 }}>
          {userData?.tokenResult.signInProvider === 'password' ? (
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
              {userData?.tokenResult.signInProvider === 'password' ? (
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
              {userData?.tokenResult.signInProvider === 'password' ? (
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
                    updateNotifications(
                      value,
                      subscribedToNewsletter,
                      emailNotificationsEnabled,
                      allowDirectMessages
                    );
                  }}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {}}
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
                  <Feather name="lock" color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Secure Lock-Screen Preview
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Show message text on lock screen
                </StyledText>
              </View>
              <View
                style={{
                  paddingLeft: spacing.x10,
                  alignItems: 'flex-end',
                }}
              >
                <Switch
                  disabled={isLoading || isSecurePreviewLoading}
                  value={securePreviewEnabled}
                  onValueChange={updateSecurePreview}
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
                    updateNotifications(
                      pushNotificationsEnabled,
                      subscribedToNewsletter,
                      value,
                      allowDirectMessages
                    );
                  }}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {}}
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
              <View style={{ flex: 1 }}>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Allow Direct Messages
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Let connected users send you messages
                </StyledText>
              </View>
              <View
                style={{
                  paddingLeft: spacing.x10,
                  alignItems: 'flex-end',
                }}
              >
                <Switch
                  disabled={isLoading}
                  value={allowDirectMessages}
                  onValueChange={(value) => {
                    setAllowDirectMessages(value);
                    updateNotifications(
                      pushNotificationsEnabled,
                      subscribedToNewsletter,
                      emailNotificationsEnabled,
                      value
                    );
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
                    updateNotifications(
                      pushNotificationsEnabled,
                      value,
                      emailNotificationsEnabled,
                      allowDirectMessages
                    );
                  }}
                />
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
                Creator
              </StyledText>
            </View>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate(
                  creatorMenuState === 'settings' ? 'InfluencerSettings' : 'InfluencerStepOne'
                );
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
                  {creatorMenuLabel}
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  {creatorMenuDescription}
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
                  {appVersion}
                </StyledText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
export default Settings;
