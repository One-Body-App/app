import React, { useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { Switch } from 'react-native-paper';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { ApiCall } from '@/services/api';
import { setUserDataNotifications } from '@/src/redux/actions/UserAction';
import { useToast } from 'react-native-toast-notifications';
import { setProfile } from '@/src/redux/actions/AuthActions';
import { useTheme } from '@react-navigation/native';
import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = StackScreenProps<SettingsStackParamsList, 'NotificationSettings'>;

const NotificationSettings = ({ navigation }: Props) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
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
        token: token,
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

      console.log(e);
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
        token: token,
        verb: 'patch',
      });

      if (res?.status == 200) {
        dispatch(setUserDataNotifications({ notifications }));

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
      console.log(e);
    }
  };

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <View style={styles.innerContainer}>
        <View style={{ ...styles.list, backgroundColor: colors.card }}>
          <Text style={{ ...styles.heading, color: colors.text }}>Push Notifications</Text>

          <Switch
            disabled={isLoading}
            value={notificationSwitch.pushNotificationsEnabled}
            color="#126B87"
            onValueChange={() => {
              // updateUserDataNotifications({
              //   notifications: {
              //     pushNotificationsEnabled: !pushNotificationSwitchOn,
              //   },

              //   token,
              // })
              // setPushNotificationSwitch(!pushNotificationSwitchOn);
              setNotificationSwitch({
                ...notificationSwitch,
                pushNotificationsEnabled: !notificationSwitch.pushNotificationsEnabled,
              });
            }}
          />
        </View>
        <View style={{ ...styles.list, backgroundColor: colors.card }}>
          <Text style={{ ...styles.heading, color: colors.text }}>Email Notifications</Text>

          <Switch
            disabled={isLoading}
            value={notificationSwitch.emailNotificationsEnabled}
            color="#126B87"
            onValueChange={() => {
              // updateUserDataNotifications({
              //   notifications: {
              //     emailNotificationsEnabled: !emailNotificationSwitchOn,
              //   },

              //   token,
              // })

              // setEmaiNotificationSwitch(!emailNotificationSwitchOn);
              setNotificationSwitch({
                ...notificationSwitch,
                emailNotificationsEnabled: !notificationSwitch.emailNotificationsEnabled,
              });
            }}
          />
        </View>
        <View style={{ ...styles.list, backgroundColor: colors.card }}>
          <View style={{ width: '80%' }}>
            <Text style={{ ...styles.heading, color: colors.text }}>
              Subscribe to the Newsletter
            </Text>
            {/* <Text numberOfLines={2} style={{ color: '#70747D' }}>
              Receive emails with events reccommendations based on...
            </Text> */}
          </View>

          <Switch
            disabled={isLoading}
            value={notificationSwitch.subscribedToNewsletter}
            color="#126B87"
            onValueChange={() => {
              // updateUserDataNotifications({
              //   notifications: {
              //     subscribeToNewsletter: !newsletterNotificationSwitchOn,
              //   },

              //   token,
              // })

              // setNewsletterNotificationSwitch(!newsletterNotificationSwitchOn);
              setNotificationSwitch({
                ...notificationSwitch,
                subscribedToNewsletter: !notificationSwitch.subscribedToNewsletter,
              });
            }}
          />
        </View>
      </View>
    </View>
  );
};
export default NotificationSettings;
