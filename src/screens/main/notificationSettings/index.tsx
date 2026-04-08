import React, { useEffect } from 'react';
import { View, Switch, ActivityIndicator, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
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

type Props = StackScreenProps<SettingsStackParamsList, 'NotificationSettings'>;

function NotificationSettings({ navigation }: Props) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();

  const [isLoaded, setIsLoaded] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [notificationSwitch, setNotificationSwitch] = React.useState({
    pushNotificationsEnabled: false,
    emailNotificationsEnabled: false,
    subscribedToNewsletter: false,
  });
  const { colors } = useTheme();

  const getUserProfile = async () => {
    const toastId = toast.show(<ActivityIndicator color={colors.text} />, {
      id: 'loadig',
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

      if (res?.status == 200) {
        dispatch(setProfile({ token, ...res.response }));
        setNotificationSwitch({
          pushNotificationsEnabled: res.response?.pushNotificationsEnabled ?? false,
          emailNotificationsEnabled: res.response?.emailNotificationsEnabled ?? false,
          subscribedToNewsletter: res.response?.subscribedToNewsletter ?? false,
        });

        setIsLoaded(true);
        toast.hide(toastId);
      } else {
        toast.hide(toastId);
      }
    } catch (e) {
      toast.hide(toastId);
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  useEffect(() => {
    if (isLoaded && !isLoading) {
      updateNotifications();
    }
  }, [notificationSwitch]);

  const updateNotifications = async () => {
    toast.hide('loading');
    const toastId = toast.show(<ActivityIndicator color={colors.text} />, {
      id: 'loadingB',
      placement: 'top',
      style: {
        backgroundColor: colors.background,
      },
    });
    setIsLoading(true);
    try {
      const notifications = {
        pushNotificationsEnabled: notificationSwitch.pushNotificationsEnabled,
        subscribedToNewsletter: notificationSwitch.subscribedToNewsletter,
        emailNotificationsEnabled: notificationSwitch.emailNotificationsEnabled,
      };

      const res = await ApiCall({
        params: notifications,
        route: `user/set-notifications`,
        token,
        verb: 'patch',
      });

      if (res?.status == 200) {
        dispatch(setUserDataNotifications({ notifications }));

        if (notificationSwitch.pushNotificationsEnabled) {
          await enablePushNotifications(token, true);
        } else {
          await disablePushNotifications(token);
        }

        toast.show('Notifications Settings Updated Successfully', {
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

  const rows: {
    key: keyof typeof notificationSwitch;
    label: string;
    description: string;
    Icon: React.ComponentType<{ color: string; size: number }>;
  }[] = [
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
                  onValueChange={() =>
                    setNotificationSwitch({
                      ...notificationSwitch,
                      [key]: !notificationSwitch[key],
                    })
                  }
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
