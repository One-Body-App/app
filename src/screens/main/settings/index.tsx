import React, { useCallback } from 'react';
import { View, Pressable, ScrollView, Switch, ActivityIndicator } from 'react-native';
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
import { setProfile } from '@/src/redux/actions/AuthActions';
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
type NotificationSwitchState = {
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  subscribedToNewsletter: boolean;
  tagNotificationsEnabled: boolean;
  allowDirectMessages: boolean;
};

function Settings({ navigation }: Props) {
  const appVersion = DeviceInfo.getVersion();

  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const dispatch = useDispatch();
  const toast = useToast();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [notificationSwitch, setNotificationSwitch] = React.useState<NotificationSwitchState>({
    pushNotificationsEnabled: false,
    emailNotificationsEnabled: false,
    subscribedToNewsletter: false,
    tagNotificationsEnabled: true,
    allowDirectMessages: true,
  });
  const [securePreviewEnabled, setSecurePreviewEnabledState] = React.useState(false);
  const [isSecurePreviewLoading, setIsSecurePreviewLoading] = React.useState(true);

  const { colors } = useTheme();
  const creatorStatus = userProfile?.influencerProfile?.influencerStatus;
  const creatorMenuState = getCreatorMenuState(creatorStatus);
  const creatorMenuLabel = getCreatorMenuLabel(creatorStatus);
  const creatorMenuDescription =
    creatorMenuState === 'settings'
      ? 'Update your creator profile settings'
      : 'Apply to share your content on One Body';

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const getUserProfile = async () => {
        try {
          const res = await ApiCall({
            route: 'user/my-profile',
            token,
            verb: 'get',
          });

          if (!isActive || res?.status !== 200) {
            return;
          }

          dispatch(setProfile({ token, ...res.response }));
          setNotificationSwitch({
            pushNotificationsEnabled: res.response?.pushNotificationsEnabled ?? false,
            emailNotificationsEnabled: res.response?.emailNotificationsEnabled ?? false,
            subscribedToNewsletter: res.response?.subscribedToNewsletter ?? false,
            tagNotificationsEnabled: res.response?.tagNotificationsEnabled ?? true,
            allowDirectMessages: res.response?.allowDirectMessages ?? true,
          });
          setIsLoaded(true);
        } catch {
          if (isActive) {
            setIsLoaded(true);
          }
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
    }, [dispatch, token])
  );

  const showSavingToast = useCallback(() => {
    toast.hide('loading');
    return toast.show(<ActivityIndicator color={colors.text} />, {
      id: 'loadingB',
      placement: 'top',
      style: {
        backgroundColor: colors.background,
      },
    });
  }, [colors.background, colors.text, toast]);

  const updateNotifications = useCallback(
    async (
      nextNotificationSwitch: NotificationSwitchState,
      previousNotificationSwitch: NotificationSwitchState
    ) => {
      const toastId = showSavingToast();
      setIsLoading(true);

      try {
        const notifications = {
          pushNotificationsEnabled: nextNotificationSwitch.pushNotificationsEnabled,
          subscribedToNewsletter: nextNotificationSwitch.subscribedToNewsletter,
          emailNotificationsEnabled: nextNotificationSwitch.emailNotificationsEnabled,
          tagNotificationsEnabled: nextNotificationSwitch.tagNotificationsEnabled,
          allowDirectMessages: nextNotificationSwitch.allowDirectMessages,
        };

        const res = await ApiCall({
          params: notifications,
          route: 'user/set-notifications',
          token,
          verb: 'patch',
        });

        if (res?.status !== 200) {
          setNotificationSwitch(previousNotificationSwitch);
          return;
        }

        dispatch(setUserDataNotifications({ notifications }));

        if (
          nextNotificationSwitch.pushNotificationsEnabled !==
          previousNotificationSwitch.pushNotificationsEnabled
        ) {
          if (nextNotificationSwitch.pushNotificationsEnabled) {
            await enablePushNotifications(token, true);
          } else {
            await disablePushNotifications(token);
          }
        }

        toast.show('Notifications Settings Updated Successfully', {
          type: 'success',
          placement: 'top',
        });
      } catch {
        setNotificationSwitch(previousNotificationSwitch);
      } finally {
        toast.hide(toastId);
        setIsLoading(false);
      }
    },
    [dispatch, showSavingToast, toast, token]
  );

  const updateSecurePreview = useCallback(
    async (enabled: boolean) => {
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
    },
    [toast]
  );

  const renderNotificationRow = (
    key: keyof NotificationSwitchState,
    label: string,
    description: string,
    Icon: React.ComponentType<{ color: string; size: number }>,
    marginBottom: number
  ) => (
    <View key={key} style={{ flexDirection: 'row', marginBottom }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}>
        <View
          style={{
            borderRadius: borderRadius.max,
            backgroundColor: Colors.neutral[800],
            padding: 6,
          }}
        >
          <Icon color={Colors.primary.brand} size={18} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
          {label}
        </StyledText>
        <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
          {description}
        </StyledText>
      </View>
      <View style={{ paddingLeft: spacing.x10, alignItems: 'flex-end' }}>
        <Switch
          disabled={isLoading}
          value={notificationSwitch[key]}
          onValueChange={(nextValue) => {
            const previousNotificationSwitch = notificationSwitch;
            const nextNotificationSwitch = {
              ...notificationSwitch,
              [key]: nextValue,
            };

            setNotificationSwitch(nextNotificationSwitch);
            if (!isLoaded || isLoading) {
              return;
            }

            updateNotifications(nextNotificationSwitch, previousNotificationSwitch);
          }}
        />
      </View>
    </View>
  );

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
                <Pressable
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
                </Pressable>
              ) : null}
              {userData?.tokenResult.signInProvider === 'password' ? (
                <Pressable
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
                </Pressable>
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

            {renderNotificationRow(
              'tagNotificationsEnabled',
              'Tagged',
              'Notify me when I am tagged in a post',
              NotificationStatus,
              spacing.x16
            )}

            {renderNotificationRow(
              'pushNotificationsEnabled',
              'Push Notifications',
              'Send notifications to phone',
              NotificationStatus,
              spacing.x16
            )}

            <View style={{ flexDirection: 'row', marginBottom: spacing.x16 }}>
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
              <View style={{ paddingLeft: spacing.x10, alignItems: 'flex-end' }}>
                <Switch
                  disabled={isLoading || isSecurePreviewLoading}
                  value={securePreviewEnabled}
                  onValueChange={updateSecurePreview}
                />
              </View>
            </View>

            {renderNotificationRow(
              'emailNotificationsEnabled',
              'Email Notifications',
              'Send notifications to email',
              SmsNotification,
              spacing.x16
            )}

            {renderNotificationRow(
              'allowDirectMessages',
              'Allow Direct Messages',
              'Let connected users send you messages',
              Sms,
              spacing.x16
            )}

            {renderNotificationRow(
              'subscribedToNewsletter',
              'Subscribe to Newsletter',
              'Be updated with One Body',
              Note1,
              0
            )}
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
                Privacy
              </StyledText>
            </View>

            <Pressable
              onPress={() => navigation.navigate('PrivacySettings')}
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
                  <Feather name="lock" color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Privacy Settings
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Control who can tag and interact with you
                </StyledText>
              </View>
            </Pressable>
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

            <Pressable
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
            </Pressable>
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

            <Pressable
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
            </Pressable>
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

            <Pressable
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
            </Pressable>

            <Pressable
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
            </Pressable>

            <Pressable
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
            </Pressable>

            {/* <Pressable
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
            </Pressable> */}

            <Pressable onPress={() => {}} style={{ flexDirection: 'row' }}>
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
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
export default Settings;
