import { StackScreenProps } from '@react-navigation/stack';
import { CommonActions, useFocusEffect, useTheme } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import LottieView from 'lottie-react-native';
import { useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import StyledText from '@/components/styled/Text';
import { ApiCall } from '@/services/api';
import { OpenURLButton } from '@/services/constants';
import { MainStackParamList } from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { body, header } from '@/src/styles/typography';
// eslint-disable-next-line import/extensions
import successDoneAnimation from '@/src/assets/animations/successfully-done.json';

type Props = StackScreenProps<MainStackParamList, 'ReportStatus'>;

const COMMUNITY_GUIDELINES_URL =
  'https://app.termly.io/policy-viewer/policy.html?policyUUID=84dd2dd3-ee3f-48f4-a92c-24b637820776';

function ReportStatus({ navigation, route }: Props) {
  const { dark } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();
  const [isBlocking, setIsBlocking] = useState(false);

  const background = dark ? '#111d21' : '#f6f7f8';
  const surface = dark ? '#0d181c' : '#ffffff';
  const titleColor = dark ? '#ffffff' : '#0d181c';
  const subtitleColor = dark ? '#9ab4bf' : '#4a636c';
  const primary = '#126b87';
  const secondaryButton = dark ? '#1f2f35' : '#e7f0f4';
  const separator = dark ? '#213038' : '#e5ecef';
  const warningColor = '#dc2626';

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;

      StatusBar.setBarStyle(dark ? 'light-content' : 'dark-content');
      StatusBar.setBackgroundColor(background);
      StatusBar.setTranslucent(false);

      return undefined;
    }, [background, dark])
  );

  const closeFlow = () => {
    if (__DEV__) {
      const state = navigation.getState();
      const currentRouteName = state.routes[state.index]?.name;
      console.log(
        '[ReportStatus] Closing report flow from route:',
        currentRouteName,
        '-> resetting to MainRoot/Main/HomeTab/Home'
      );
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'MainRoot',
            params: {
              screen: 'Main',
              params: {
                screen: 'HomeTab',
                params: {
                  screen: 'Home',
                },
              },
            },
          } as any,
        ],
      })
    );
  };

  const blockUser = async () => {
    const targetUserId = route.params?.reportedUserId;
    if (!targetUserId) {
      toast.show('User unavailable for block action.', { placement: 'bottom' });
      return;
    }

    setIsBlocking(true);
    try {
      const result = await ApiCall({
        route: `user/unsubscribe/${targetUserId}`,
        token,
        verb: 'patch',
      });

      if (result?.status === 200) {
        toast.show('User blocked from your feed.', { placement: 'bottom' });
      } else {
        toast.show('Unable to block user right now.', { placement: 'bottom' });
      }
    } catch (error) {
      toast.show('Unable to block user right now.', { placement: 'bottom' });
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
      {Platform.OS === 'android' ? (
        <StatusBar
          barStyle={dark ? 'light-content' : 'dark-content'}
          backgroundColor={background}
        />
      ) : null}

      <View style={{ flex: 1, backgroundColor: surface }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.x16,
            paddingTop: spacing.x10,
            paddingBottom: spacing.x8,
          }}
        >
          <TouchableOpacity
            onPress={closeFlow}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="close" size={30} color={titleColor} />
          </TouchableOpacity>
          <StyledText style={[header.h2, { color: titleColor }]}>Report Status</StyledText>
          <View style={{ width: 44 }} />
        </View>

        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: spacing.x24,
            paddingTop: spacing.x24,
          }}
        >
          <View
            style={{
              width: 132,
              height: 132,
              borderRadius: 66,
              backgroundColor: 'rgba(18,107,135,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.x20,
            }}
          >
            <View
              style={{
                width: 102,
                height: 102,
                borderRadius: 51,
                backgroundColor: primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: primary,
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 8 },
                shadowRadius: 12,
                elevation: 6,
                overflow: 'hidden',
              }}
            >
              <LottieView
                source={successDoneAnimation}
                autoPlay
                loop
                resizeMode="contain"
                style={{
                  width: 102,
                  height: 102,
                }}
              />
            </View>
          </View>

          <StyledText
            style={[
              header.h1,
              {
                color: titleColor,
                textAlign: 'center',
                marginBottom: spacing.x13,
              },
            ]}
          >
            Thanks for letting us know
          </StyledText>

          <StyledText
            style={[
              body.x2,
              {
                color: subtitleColor,
                textAlign: 'center',
                lineHeight: 34 / 2,
                paddingHorizontal: spacing.x8,
              },
            ]}
          >
            Your report has been submitted for review. We use these reports to keep our community
            safe and positive.
          </StyledText>

          <View
            style={{
              width: '100%',
              minHeight: 142,
              borderRadius: borderRadius.large,
              backgroundColor: dark ? '#18262c' : '#edf3f6',
              marginTop: spacing.x24,
              paddingHorizontal: spacing.x16,
              paddingVertical: spacing.x16,
              borderWidth: 1,
              borderColor: dark ? '#23414a' : '#d7e4ea',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(220,38,38,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.x10,
                }}
              >
                <MaterialCommunityIcons name="shield-check" size={24} color={warningColor} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <StyledText style={[header.h2, { color: warningColor, textAlign: 'center' }]}>
                  Report Submitted
                </StyledText>
                <StyledText
                  style={[
                    body.x2,
                    {
                      color: dark ? '#f18d8d' : '#b42318',
                      marginTop: 2,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Safety is our priority.
                </StyledText>
              </View>
            </View>

            <View
              style={{
                marginTop: spacing.x13,
                alignSelf: 'center',
                borderRadius: borderRadius.button,
                backgroundColor: dark ? 'rgba(18,107,135,0.24)' : 'rgba(18,107,135,0.12)',
                paddingHorizontal: spacing.x10,
                paddingVertical: spacing.x5,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="check-decagram-outline" size={14} color={primary} />
              <StyledText
                style={[
                  body.x1,
                  {
                    color: primary,
                    marginLeft: spacing.x5,
                    fontWeight: '700',
                  },
                ]}
              >
                Moderation queue updated
              </StyledText>
            </View>
          </View>
        </View>

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: separator,
            paddingHorizontal: spacing.x24,
            paddingTop: spacing.x20,
            paddingBottom: spacing.x24,
          }}
        >
          <TouchableOpacity
            onPress={closeFlow}
            style={{
              height: 58,
              borderRadius: borderRadius.button,
              backgroundColor: primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.x10,
            }}
          >
            <StyledText style={[body.x2, { color: '#ffffff', fontWeight: '700', fontSize: 18 }]}>
              Done
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={blockUser}
            disabled={isBlocking}
            style={{
              height: 58,
              borderRadius: borderRadius.button,
              backgroundColor: secondaryButton,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.x16,
              flexDirection: 'row',
            }}
          >
            {isBlocking ? (
              <ActivityIndicator color={titleColor} style={{ marginRight: spacing.x8 }} />
            ) : (
              <MaterialCommunityIcons
                name="block-helper"
                size={22}
                color={titleColor}
                style={{ marginRight: spacing.x8 }}
              />
            )}
            <StyledText style={[body.x2, { color: titleColor, fontWeight: '700', fontSize: 18 }]}>
              Block User
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              OpenURLButton(COMMUNITY_GUIDELINES_URL);
            }}
            style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.x8 }}
          >
            <StyledText style={[body.x2, { color: primary, fontWeight: '700' }]}>
              Learn more about our Community Guidelines
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ReportStatus;
