import React, { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import Button from '../../../components/Button';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { styles } from './styles';
import { RootState } from '@/src/redux/reducers/rootReducer';

import {
  INSTAGRAM_APP_ID,
  INSTAGRAM_CONNECT_REDIRECT,
  INSTAGRAM_RECONNECT_REDIRECT,
  getInstagramAuthToken,
  OpenURLButton,
} from '@/services/constants';
import { getProfile, removeSocialAccountRequest } from '@/src/redux/actions/AuthActions';
import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerSettings'>;

function InfluencerSettings({ route }: Props) {
  const userToken = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  const dispatch = useDispatch();

  const time = new Date().getTime() / 1000;
  const { colors } = useTheme();
  const [instagramTokenExpiresAtReal, setInstagramTokenExpiresAtReal] = useState<number>();

  useEffect(() => {
    if (route.params?.service === 'instagram' && route.params?.code) {
      getInstagramAuthToken(
        route.params.code,
        userToken,
        route.params.action === 'reconnect'
          ? INSTAGRAM_RECONNECT_REDIRECT
          : INSTAGRAM_CONNECT_REDIRECT
      ).then((result) => {
        if (result && result.instagramTokenExpiresAtReal) {
          setInstagramTokenExpiresAtReal(parseInt(result.instagramTokenExpiresAtReal, 10));
          dispatch(
            getProfile.Request({
              token: userToken,
            })
          );
        }
      });
    }
  }, [dispatch, route.params, userToken]);

  let currentInstagramTokenExpiresAtReal =
    userProfile?.influencerProfile?.instagramTokenExpirationReal || 0;
  if (instagramTokenExpiresAtReal) {
    currentInstagramTokenExpiresAtReal = instagramTokenExpiresAtReal;
  }

  const showInstagramWarning =
    userProfile?.influencerProfile?.instagramId && currentInstagramTokenExpiresAtReal < time;

  const btnTextStyle = {
    paddingVertical: 7,
    fontSize: getFontSize(1.5),
    letterSpacing: 1.25,
  };

  const openInstagramFlow = (redirectUri: string) => {
    OpenURLButton(
      `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`,
      false,
      true,
      redirectUri
    );
  };

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <View style={styles.innerContainer}>
        <View style={{ paddingHorizontal: 25, paddingTop: 25 }}>
          {userProfile?.influencerProfile?.influencerStatus !== 'approved' ? (
            <View style={{ backgroundColor: 'yellow', padding: 10, marginBottom: 10 }}>
              <Text style={{ color: '#000' }}>
                All changes made on this view needs to go through the account approval process
              </Text>
            </View>
          ) : null}
          <Text>
            Disclaimer: Any changes to your creator profile will trigger an approval process
          </Text>
          <View style={{ flexDirection: 'row', marginTop: getHeight(5), marginBottom: 10 }}>
            <Ionicons name="logo-instagram" color="#032F3C" size={20} />
            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginLeft: 5,
                fontFamily: 'OpenSans-Regular',
              }}
            >
              Creator Instagram Account
            </Text>
          </View>

          {showInstagramWarning ? (
            <View style={{ backgroundColor: '#E90202', padding: 10, marginBottom: 10 }}>
              <Text style={{ color: 'white' }}>Please reconnect your Instagram account</Text>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {userProfile?.influencerProfile?.instagramHandler ? (
              <>
                <Text>{userProfile.influencerProfile.instagramHandler}</Text>
                {showInstagramWarning ? (
                  <Button
                    text="Reconnect Account"
                    btnStyle={styles.buttonContainer}
                    btnTextStyle={btnTextStyle}
                    onPress={() => openInstagramFlow(INSTAGRAM_RECONNECT_REDIRECT)}
                    disabled={userProfile?.influencerProfile?.influencerStatus != 'approved'}
                  />
                ) : (
                  <Button
                    text="Remove Account"
                    btnStyle={[styles.buttonContainer, { backgroundColor: '#E90202' }]}
                    btnTextStyle={btnTextStyle}
                    disabled={userProfile?.influencerProfile?.influencerStatus != 'approved'}
                    onPress={async () => {
                      dispatch(
                        removeSocialAccountRequest({
                          type: 'instagram',
                          token: userToken,
                        })
                      );
                    }}
                  />
                )}
              </>
            ) : (
              <Button
                text="Connect Account"
                btnStyle={styles.buttonContainer}
                disabled={userProfile?.influencerProfile?.influencerStatus != 'approved'}
                btnTextStyle={btnTextStyle}
                onPress={() => openInstagramFlow(INSTAGRAM_CONNECT_REDIRECT)}
              />
            )}
          </View>

          {userProfile?.influencerProfile?.instagramHandler ? (
            <View style={{ marginTop: getHeight(3) }}>
              <Text
                style={{ color: '#4f6d77' }}
                onPress={() =>
                  Linking.openURL(
                    `https://www.instagram.com/${userProfile?.influencerProfile?.instagramHandler}`
                  )
                }
              >
                View connected profile
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default InfluencerSettings;
