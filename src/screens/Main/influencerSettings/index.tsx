import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Switch } from 'react-native-paper';
import Button from '../../../Components/Button';
import auth from '@react-native-firebase/auth';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';
import Header from '@/components/Header';
import { useDispatch, useSelector } from 'react-redux';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { ApiCall } from '@/src/Services/api';
import { getUserProfile, setUserDataNotifications } from '@/src/Redux/actions/UserAction';
import { useToast } from 'react-native-toast-notifications';
import { setProfile } from '@/src/Redux/actions/AuthActions';
import { useTheme } from '@react-navigation/native';
import GoBackIcon from '@/src/Components/GoBackIcon';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import {
  INSTAGRAM_APP_ID,
  INSTAGRAM_CONNECT_REDIRECT,
  INSTAGRAM_RECONNECT_REDIRECT,
  BASE_URL,
} from '@/src/Services/constants';
import axios from 'axios';

type Props = StackScreenProps<RootStackParamList, 'InfluencerSettings'>;

const InfluencerSettings = ({ navigation, route }: Props) => {
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const time = new Date().getTime() / 1000;
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const showTwitterWarning = false;

  const [instagramUsername, setInstagramUsername] = useState<string>();
  const [instagramId, setInstagramId] = useState<string>();
  const [instagramToken, setInstagramToken] = useState<string>();
  const [instagramTokenExpiresAt, setInstagramTokenExpiresAt] = useState<number>();
  const [instagramTokenExpiresAtReal, setInstagramTokenExpiresAtReal] = useState<number>();

  const [twitterUsername, setTwitterUsername] = useState<string>();

  const getInstagramData = async (
    accessToken: string,
    accessTokenExpiresAt: string,
    accessTokenExpiresAtReal: string
  ) => {
    try {
      const options = {
        method: 'GET',
        url: `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const result = await axios.request(options);

      setInstagramUsername(result.data.username);
      setInstagramId(result.data.id);
      setInstagramToken(accessToken);
      setInstagramTokenExpiresAt(parseInt(accessTokenExpiresAt));
      setInstagramTokenExpiresAtReal(parseInt(accessTokenExpiresAtReal));
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (route.params?.service == 'instagram' && route.params?.code) {
      const getInstagramAuthToken = async () => {
        try {
          const options = {
            method: 'POST',
            url: `${BASE_URL}/auth/instagram-token`,
            data: {
              code: route.params?.code,
              updateUser: true,
              redirect_uri:
                route.params?.action == 'reconnect'
                  ? INSTAGRAM_RECONNECT_REDIRECT
                  : INSTAGRAM_CONNECT_REDIRECT,
            },
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`,
            },
          };

          const result = await axios.request(options);

          if (result && result.data?.access_token) {
            setInstagramTokenExpiresAt(parseInt(result.data?.expiresAt));
            setInstagramTokenExpiresAtReal(parseInt(result.data?.expiresAtReal));
            dispatch(getUserProfile({ token: token }));
          }
        } catch (error: any) {
          console.log(error);
        }
      };
      getInstagramAuthToken();
    }

    if (
      route.params?.action == 'twitter' &&
      route.params?.oauth_token &&
      route.params?.oauth_verifier
    ) {
      const getTwitterAuthToken = async () => {
        try {
          const options = {
            method: 'POST',
            url: 'https://api.twitter.com/oauth/access_token',
            params: {
              oauth_token: route.params?.oauth_token,
              oauth_verifier: route.params?.oauth_verifier,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          };
          const result = await axios.request(options);

          if (result.data) {
            const tokenData = result.data.split('&')?.map((item: string) => {
              return item.split('=')[1];
            });

            const screenName = tokenData[3];

            setTwitterUsername(screenName);
          }
        } catch (error: any) {}
      };
      getTwitterAuthToken();
    }
  }, [route.params]);

  let currentInstagramTokenExpiresAtReal =
    userProfile?.influencerProfile?.instagramTokenExpirationReal || 0;
  if (instagramTokenExpiresAtReal) {
    currentInstagramTokenExpiresAtReal = instagramTokenExpiresAtReal;
  }

  const showInstagramWarning = currentInstagramTokenExpiresAtReal < time;

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <GeneralStatusBar backgroundColor={colors.background} hidden={false} translucent={true} />

      <Header
        title={'Influencer settings'}
        leftView={<GoBackIcon color={colors.text} />}
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <View style={{ paddingHorizontal: 25 }}>
          <View style={{ flexDirection: 'row', marginTop: getHeight(5), marginBottom: 5 }}>
            <Ionicons name="logo-instagram" color={'#032F3C'} size={20} />
            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginLeft: 5,
                fontFamily: 'Rubik-Regular',
              }}
            >
              Instagram Account
            </Text>
          </View>

          {showInstagramWarning ? (
            <View style={{ backgroundColor: '#E90202', padding: 10, marginBottom: 10 }}>
              <Text style={{ color: 'white' }}>Please Reconnect your Instagram Account</Text>
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
                <Text>{userProfile.influencerProfile?.instagramHandler}</Text>
                {showInstagramWarning ? (
                  <Button
                    text="Reconnect Account"
                    btnStyle={{
                      ...GeneralStyle.btn,

                      backgroundColor: 'blue',
                      borderRadius: 10,
                      // flex: 1,
                      marginHorizontal: 10,
                      padding: 10,
                    }}
                    btnTextStyle={{
                      marginHorizontal: 20,
                      color: 'white',
                      fontSize: 14,
                    }}
                    onPress={() => {
                      Linking.openURL(
                        `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_RECONNECT_REDIRECT}&scope=user_profile,user_media&response_type=code`
                      );
                    }}
                  />
                ) : (
                  <Button
                    text="Remove Account"
                    btnStyle={{
                      ...GeneralStyle.btn,

                      backgroundColor: 'red',
                      borderRadius: 10,
                      // flex: 1,
                      marginHorizontal: 10,
                      padding: 10,
                    }}
                    btnTextStyle={{
                      marginHorizontal: 20,
                      color: 'white',
                      fontSize: 14,
                    }}
                    onPress={async () => {}}
                  />
                )}
              </>
            ) : (
              <>
                <Button
                  text="Connect Account"
                  btnStyle={{
                    ...GeneralStyle.btn,

                    backgroundColor: 'blue',
                    borderRadius: 10,
                    // flex: 1,
                    marginHorizontal: 10,
                    padding: 10,
                  }}
                  btnTextStyle={{
                    marginHorizontal: 20,
                    color: 'white',
                    fontSize: 14,
                  }}
                  onPress={() => {
                    Linking.openURL(
                      `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_CONNECT_REDIRECT}&scope=user_profile,user_media&response_type=code`
                    );
                  }}
                />
              </>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 25 }}>
          <View style={{ flexDirection: 'row', marginTop: getHeight(5), marginBottom: 5 }}>
            <Ionicons name="logo-twitter" color={'#032F3C'} size={20} />
            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginLeft: 5,
                fontFamily: 'Rubik-Regular',
              }}
            >
              Twitter Account
            </Text>
          </View>

          {showTwitterWarning ? (
            <View style={{ backgroundColor: '#E90202', padding: 10 }}>
              <Text style={{ color: 'white' }}>Please Reconnect your Twitter Account</Text>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {userProfile?.influencerProfile?.twitterHandler ? (
              <>
                <Text>{userProfile.influencerProfile?.twitterHandler}</Text>
                {showTwitterWarning ? (
                  <Button
                    text="Reconnect Account"
                    btnStyle={{
                      ...GeneralStyle.btn,

                      backgroundColor: 'blue',
                      borderRadius: 10,
                      // flex: 1,
                      marginHorizontal: 10,
                      padding: 10,
                    }}
                    btnTextStyle={{
                      marginHorizontal: 20,
                      color: 'white',
                      fontSize: 14,
                    }}
                    onPress={async () => {}}
                  />
                ) : (
                  <Button
                    text="Remove Account"
                    btnStyle={{
                      ...GeneralStyle.btn,

                      backgroundColor: 'red',
                      borderRadius: 10,
                      // flex: 1,
                      marginHorizontal: 10,
                      padding: 10,
                    }}
                    btnTextStyle={{
                      marginHorizontal: 20,
                      color: 'white',
                      fontSize: 14,
                    }}
                    onPress={async () => {}}
                  />
                )}
              </>
            ) : (
              <>
                <Button
                  text="Connect Account"
                  btnStyle={{
                    ...GeneralStyle.btn,

                    backgroundColor: 'blue',
                    borderRadius: 10,
                    // flex: 1,
                    marginHorizontal: 10,
                    padding: 10,
                  }}
                  btnTextStyle={{
                    marginHorizontal: 20,
                    color: 'white',
                    fontSize: 14,
                  }}
                  onPress={async () => {}}
                />
              </>
            )}
          </View>
        </View>

        {/* <Text> This should trigger a new approval process if the account is changed</Text> */}
      </View>
    </View>
  );
};
export default InfluencerSettings;
