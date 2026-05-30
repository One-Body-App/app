import React, { useCallback, useEffect } from 'react';
import { View, Switch, ActivityIndicator, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useToast } from 'react-native-toast-notifications';
import { useTheme } from '@react-navigation/native';
import { NotificationStatus, Sms, Note1 } from 'iconsax-react-native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import { setUserDataNotifications } from '@/src/redux/actions/UserAction';
import { setProfile } from '@/src/redux/actions/AuthActions';
import { SettingsStackParamsList } from '@/src/navigator/types';
import {
  disablePushNotifications,
  enablePushNotifications,
} from '@/src/services/notification/pushNotificationService';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { Colors, Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';

type Props = NativeStackScreenProps<SettingsStackParamsList, 'NotificationSettings'>;

type NotificationSwitchState = {
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  subscribedToNewsletter: boolean;
  tagNotificationsEnabled: boolean;
};

function NotificationSettings(_props: Props) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();
  const { colors } = useTheme();

  const isLoadedRef = React.useRef(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [notificationSwitch, setNotificationSwitch] = React.useState<NotificationSwitchState>({
    pushNotificationsEnabled: false,
    emailNotificationsEnabled: false,
    subscribedToNewsletter: false,
    tagNotificationsEnabled: true,
  });

  const getUserProfile = useCallback(async () => {
    const toastId = toast.show(<ActivityIndicator color={colors.text} />, {
      id: 'loading-profile',
      placement: 'top',
      style: {
        backgroundColor: colors.background,
      },
    });

    try {
      const res = await ApiCall({
        route: 'user/my-profile',
        token,
        verb: 'get',
      });

      if (res?.status === 200) {
        dispatch(setProfile({ token, ...res.response }));
        setNotificationSwitch({
          pushNotificationsEnabled: res.response?.pushNotificationsEnabled ?? false,
          emailNotificationsEnabled: res.response?.emailNotificationsEnabled ?? false,
          subscribedToNewsletter: res.response?.subscribedToNewsletter ?? false,
          tagNotificationsEnabled: res.response?.tagNotificationsEnabled ?? true,
        });
      }
    } finally {
      isLoadedRef.current = true;
      toast.hide(toastId);
    }
  }, [colors.background, colors.text, dispatch, toast, token]);

  useEffect(() => {
    getUserProfile();
  }, [getUserProfile]);

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
      } catch (_error) {
        setNotificationSwitch(previousNotificationSwitch);
      } finally {
        toast.hide(toastId);
        setIsLoading(false);
      }
    },
    [dispatch, showSavingToast, toast, token]
  );

  const rows: {
    key: keyof NotificationSwitchState;
    label: string;
    description: string;
    Icon: React.ComponentType<{ color: string; size: number }>;
  }[] = [
    {
      key: 'tagNotificationsEnabled',
      label: 'Tagged',
      description: 'Notify me when I am tagged in a post',
      Icon: NotificationStatus,
    },
    {
      key: 'pushNotificationsEnabled',
      label: 'Push Notifications',
      description: 'Send notifications to phone',
      Icon: NotificationStatus,
    },
    {
      key: 'emailNotificationsEnabled',
      label: 'Email Notifications',
      description: 'Receive email alerts',
      Icon: Sms,
    },
    {
      key: 'subscribedToNewsletter',
      label: 'Subscribe to the Newsletter',
      description: 'Receive news and updates',
      Icon: Note1,
    },
  ];

  return (
    <View style={{ flex: 1, marginHorizontal: spacing.x24, paddingBottom: spacing.x16 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            backgroundColor: colors.card,
            padding: spacing.x24,
            borderRadius: borderRadius.base,
            marginVertical: spacing.x16,
          }}
        >
          <StyledText
            style={[
              Typography.header.h3,
              { textTransform: 'uppercase', marginBottom: spacing.x16 },
            ]}
          >
            Notifications
          </StyledText>

          {rows.map(({ key, label, description, Icon }, index) => (
            <View
              key={key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: index < rows.length - 1 ? spacing.x16 : 0,
              }}
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
                    if (!isLoadedRef.current || isLoading) {
                      return;
                    }

                    updateNotifications(nextNotificationSwitch, previousNotificationSwitch);
                  }}
                  trackColor={{ false: Colors.neutral[600], true: Colors.primary.brand }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default NotificationSettings;
