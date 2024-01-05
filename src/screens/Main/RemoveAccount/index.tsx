import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '@/src/components/Header';
import Button from '@/src/components/Button';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';

import { GeneralStyle } from '../../../constants/GeneralStyle';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '@react-navigation/native';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Spacing, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RadioButton } from 'react-native-paper';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { button } from '@/src/styles/buttons';

import auth from '@react-native-firebase/auth';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { LoginManager } from 'react-native-fbsdk-next';
import { logout } from '@/src/redux/actions/AuthActions';
import { useToast } from 'react-native-toast-notifications';

type Props = NativeStackScreenProps<SettingsStackParamsList, 'RemoveAccount'>;

const RemoveAccount = ({ navigation }: Props) => {
  const [reason, setReason] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const toast = useToast();

  const options = [
    {
      reason: 'Could not find content relevant to my faith',
    },
    {
      reason: 'I do not use One Body enough',
    },
    {
      reason: 'I have found too many bugs in the app',
    },
    {
      reason: 'App consumes a lot of battery',
    },
  ];

  useEffect(() => {
    if (loginSuccess) {
      accountDeactivate();
    }
  }, [loginSuccess]);

  const accountDeactivate = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { reason, comments },
        token: token,
        route: 'user/remove-account',
        verb: 'delete',
      });

      if (res?.status == 200) {
        toast.show('Account Removed Successfully', {
          placement: 'top',
          type: 'success',
        });

        dispatch(setLoader(false));
        LoginManager.logOut();
        dispatch(logout());

        auth().currentUser?.delete();
        auth().signOut();
      } else {
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga change pasword err --- ', e);
    }
  };

  return (
    <View style={{ flex: 1, margin: spacing.x24 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
      >
        <ScrollView>
          <View>
            <StyledText style={[Typography.header.h1]}>You will be missed</StyledText>
            <View style={{ flexDirection: 'row' }}>
              <StyledText style={[Typography.subheader.R, { color: Colors.neutral[300] }]}>
                We are sorry to see you go. Deleting your account will erase all of the data we have
                stored about you and there is{' '}
                <StyledText
                  style={[Typography.subheader.R, { color: Colors.errorFeedback.background }]}
                >
                  NO RECOVERY.
                </StyledText>
              </StyledText>
            </View>
          </View>

          <View style={{ marginTop: spacing.x24 }}>
            <StyledText style={[Typography.header.h4, { color: Colors.neutral[200] }]}>
              Please spare a moment to let us know why you are leaving:
            </StyledText>
            <View style={{ marginVertical: spacing.x24, flex: 1 }}>
              <View
                style={{
                  borderWidth: Platform.OS == 'ios' ? borderWidth.thin : 0,
                  borderColor: Colors.neutral[600],
                  borderRadius: borderRadius.base,
                  overflow: 'hidden',
                }}
              >
                {options.map((item, index) => {
                  return (
                    <Button
                      key={index}
                      text={item.reason}
                      onPress={() => setReason(item.reason)}
                      leftIcon={
                        Platform.OS == 'android' ? (
                          reason == item.reason ? (
                            <Icon
                              name="radio-button-on"
                              size={20}
                              color={Colors.errorFeedback.background}
                              style={{ marginRight: spacing.x10 }}
                            />
                          ) : (
                            <Icon
                              name="radio-button-off"
                              size={20}
                              color={Colors.neutral[200]}
                              style={{ marginRight: spacing.x10 }}
                            />
                          )
                        ) : null
                      }
                      rightIcon={
                        Platform.OS == 'ios' ? (
                          <Icon
                            name="check"
                            color={Colors.errorFeedback.background}
                            style={{
                              opacity: reason == item.reason ? 1 : 0,
                            }}
                            size={20}
                          />
                        ) : null
                      }
                      btnStyle={[
                        styles.btn,
                        {
                          borderBottomWidth:
                            index < options.length - 1 && Platform.OS == 'ios'
                              ? borderWidth.thin
                              : 0,
                        },
                      ]}
                      btnTextStyle={[
                        styles.btnText,
                        {
                          fontWeight: reason == item.reason ? 'bold' : 'normal',
                          color: !reason
                            ? colors.text
                            : reason == item.reason
                            ? Colors.errorFeedback.background
                            : Colors.neutral[500],
                        },
                      ]}
                      wrapperBtnStyle={{
                        justifyContent: Platform.OS == 'ios' ? 'space-between' : 'flex-start',
                      }}
                    />
                  );
                })}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <StyledText style={[Typography.subheader.R, { color: Colors.neutral[200] }]}>
                Additional notes
              </StyledText>
              <StyledTextInput
                multiline
                numberOfLines={3}
                maxLength={150}
                placeholder="Tell us more information"
                inputStyle={{ minHeight: 80 }}
                showCharCounter
                value={comments}
                onChangeText={(text) => {
                  setComments(text);
                }}
                counterContainerStyle={{
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                }}
                counterTextStyleStyle={{
                  marginTop: spacing.x32 * -1,
                  marginRight: spacing.x10,
                  color: Colors.neutral[300],
                }}
              />
            </View>

            <Button
              text="Remove Account"
              onPress={() => {
                setLoginSuccess(false);
                // navigation.navigate('ConfirmLogin', {});
                navigation.navigate('ConfirmLogin', {
                  updateParent: setLoginSuccess,
                });
              }}
              wrapperViewBtnStyle={{ marginTop: spacing.x32 }}
              btnStyle={[
                button.primary,
                {
                  backgroundColor: Colors.errorFeedback[200],
                  flex: 1,
                },
              ]}
              btnTextStyle={{ color: '#FFF' }}
            />

            <Button
              text="Cancel"
              onPress={() => {
                navigation.goBack();
              }}
              wrapperViewBtnStyle={{ marginTop: spacing.x10 }}
              btnStyle={[
                {
                  flex: 1,
                  padding: Spacing.spacing.x10,
                },
              ]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
export default RemoveAccount;
