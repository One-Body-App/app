import React, { useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Switch } from 'react-native-paper';

import { getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';
import Header from '@/components/Header';
import { useDispatch, useSelector } from 'react-redux';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { ApiCall } from '@/src/Services/api';
import { setUserDataNotifications } from '@/src/Redux/actions/UserAction';
import { useToast } from 'react-native-toast-notifications';

type Props = StackScreenProps<RootStackParamList, 'NotificationSettings'>;

const NotificationSettings = ({ navigation }: Props) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.userProfile);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();

  const [isLoaded, setIsLoaded] = React.useState<boolean>(false);
  const [pushNotificationSwitchOn, setPushNotificationSwitch] = React.useState(
    user?.pushNotificationsEnabled ?? false
  );
  const [emailNotificationSwitchOn, setEmaiNotificationSwitch] = React.useState(
    user?.emailNotificationsEnabled ?? false
  );
  const [newsletterNotificationSwitchOn, setNewsletterNotificationSwitch] = React.useState(
    user?.subscribeToNewsletter ?? false
  );

  useEffect(() => {
    console.log(
      pushNotificationSwitchOn,
      emailNotificationSwitchOn,
      newsletterNotificationSwitchOn,
      isLoaded
    );
    if (isLoaded) {
      updateNotifications();
    } else {
      setIsLoaded(true);
    }
  }, [
    pushNotificationSwitchOn,
    emailNotificationSwitchOn,
    newsletterNotificationSwitchOn,
    // isLoaded,
  ]);

  const updateNotifications = async () => {
    try {
      toast.show(<ActivityIndicator />, {
        placement: 'top',
      });
      const notifications = {
        pushNotificationsEnabled: pushNotificationSwitchOn,
        subscribeToNewsletter: newsletterNotificationSwitchOn,
        emailNotificationsEnabled: emailNotificationSwitchOn,
      };
      console.log(notifications);
      const res = await ApiCall({
        params: notifications,
        route: `user/set-notifications`,
        token: token,
        verb: 'patch',
      });

      if (res?.status == 200) {
        dispatch(setUserDataNotifications({ notifications }));
        toast.hideAll();
        toast.show('Notifications Settings Updated Successfully', {
          type: 'success',
          placement: 'top',
        });
      } else {
        toast.hideAll();
      }
    } catch (e) {
      toast.hideAll();

      console.log(e);
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
        title={'Notification settings'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <View style={styles.list}>
          <Text style={styles.heading}>Push Notifications</Text>

          <Switch
            value={pushNotificationSwitchOn}
            color="#126B87"
            onValueChange={() => {
              // updateUserDataNotifications({
              //   notifications: {
              //     pushNotificationsEnabled: !pushNotificationSwitchOn,
              //   },

              //   token,
              // })
              setPushNotificationSwitch(!pushNotificationSwitchOn);
            }}
          />
        </View>
        <View style={styles.list}>
          <Text style={styles.heading}>Email Notifications</Text>

          <Switch
            value={emailNotificationSwitchOn}
            color="#126B87"
            onValueChange={() => {
              // updateUserDataNotifications({
              //   notifications: {
              //     emailNotificationsEnabled: !emailNotificationSwitchOn,
              //   },

              //   token,
              // })

              setEmaiNotificationSwitch(!emailNotificationSwitchOn);
            }}
          />
        </View>
        <View style={styles.list}>
          <View style={{ width: '80%' }}>
            <Text style={styles.heading}>Subscribe to the Newsletter</Text>
            {/* <Text numberOfLines={2} style={{ color: '#70747D' }}>
              Receive emails with events reccommendations based on...
            </Text> */}
          </View>

          <Switch
            value={newsletterNotificationSwitchOn}
            color="#126B87"
            onValueChange={() => {
              // updateUserDataNotifications({
              //   notifications: {
              //     subscribeToNewsletter: !newsletterNotificationSwitchOn,
              //   },

              //   token,
              // })

              setNewsletterNotificationSwitch(!newsletterNotificationSwitchOn);
            }}
          />
        </View>
      </View>
    </View>
  );
};
export default NotificationSettings;
