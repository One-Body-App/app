import React, { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  OpenURLButton,
  TWITTER_CLIENT_ID,
  codeChallenge,
  getInstagramAuthToken,
  getTwitterAuthToken,
} from '@/services/constants';
import { getProfile, removeSocialAccountRequest } from '@/src/redux/actions/AuthActions';
import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerSettings'>;
const twitterRedirectUrl = 'onebodyapp://influencer-settings/connect/twitter';
const instagramRedirectUrl = 'onebodyapp://influencer-settings/connect/instagram';

function InfluencerSettings({ navigation, route }: Props) {
  const userToken = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  const dispatch = useDispatch();

  const time = new Date().getTime() / 1000;
  const { colors } = useTheme();

  const [isLoggedInFacebook, setIsLoggedInFacebook] = useState<boolean>(false);
  const [instagramTokenExpiresAtReal, setInstagramTokenExpiresAtReal] = useState<number>();

  const [twitterTokenExpiresAtReal, setTwitterTokenExpiresAtReal] = useState<number>();

  const [twitterStateConfirmation] = useState(Math.random().toString(36).substring(2, 30));
  const [twitterCodeConfirmation, setTwitterCodeConfirmation] = useState<string>('');

  const onTwitterButtonPress = async () => {
    try {
      OpenURLButton(
        `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          twitterRedirectUrl
        )}&scope=${encodeURIComponent(
          'tweet.read users.read offline.access follows.read'
        )}&state=${twitterStateConfirmation}&code_challenge=${twitterCodeConfirmation}&code_challenge_method=plain`,
        false,
        true,
        twitterRedirectUrl
      );

      // Linking.openURL(`https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`);
      // }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (route.params?.service == 'instagram' && route.params?.code) {
      getInstagramAuthToken(
        route.params?.code,
        userToken,
        route.params?.action == 'reconnect'
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

    if (
      route.params?.service == 'twitter' &&
      route.params?.state &&
      route.params?.code &&
      route.params?.state == twitterStateConfirmation
    ) {
      getTwitterAuthToken(
        route.params?.code,
        twitterCodeConfirmation,
        userToken,
        twitterRedirectUrl
      ).then((result) => {
        if (result && result.twitterTokenExpiresAtReal) {
          setTwitterTokenExpiresAtReal(parseInt(result.twitterTokenExpiresAtReal, 10));
          dispatch(
            getProfile.Request({
              token: userToken,
            })
          );
        }
      });
    }
  }, [route.params]);

  useEffect(() => {
    auth()
      .currentUser?.getIdTokenResult()
      .then((result) => {
        if (result.signInProvider == 'facebook.com') {
          setIsLoggedInFacebook(true);
        }
      });

    codeChallenge().then((code) => {
      setTwitterCodeConfirmation(code);
    });
  }, []);

  // useEffect(() => {
  //   if (route.params?.service == 'instagram' && route.params?.code) {
  //     const getInstagramAuthToken = async () => {
  //       try {
  //         const options = {
  //           method: 'POST',
  //           url: `${BASE_URL}/auth/instagram-token`,
  //           data: {
  //             code: route.params?.code,
  //             updateUser: true,
  //             redirect_uri:
  //               route.params?.action == 'reconnect'
  //                 ? INSTAGRAM_RECONNECT_REDIRECT
  //                 : INSTAGRAM_CONNECT_REDIRECT,
  //           },
  //           headers: {
  //             'Content-Type': 'application/json',
  //             authorization: `Bearer ${token}`,
  //           },
  //         };

  //         const result = await axios.request(options);

  //         if (result && result.data?.access_token) {
  //           setInstagramTokenExpiresAtReal(parseInt(result.data?.expiresAtReal));
  //           dispatch(getUserProfile({ token: token }));
  //         }
  //       } catch (error: any) {
  //         ;
  //       }
  //     };
  //     getInstagramAuthToken();
  //   }

  //   if (
  //     route.params?.action == 'twitter' &&
  //     route.params?.oauth_token &&
  //     route.params?.oauth_verifier
  //   ) {
  //     // const getTwitterAuthToken = async () => {
  //     //   try {
  //     //     const options = {
  //     //       method: 'POST',
  //     //       url: 'https://api.twitter.com/oauth/access_token',
  //     //       params: {
  //     //         oauth_token: route.params?.oauth_token,
  //     //         oauth_verifier: route.params?.oauth_verifier,
  //     //       },
  //     //       headers: {
  //     //         'Content-Type': 'application/json',
  //     //       },
  //     //     };
  //     //     const result = await axios.request(options);

  //     //     if (result.data) {
  //     //       const tokenData = result.data.split('&')?.map((item: string) => {
  //     //         return item.split('=')[1];
  //     //       });

  //     //       const screenName = tokenData[3];

  //     //       setTwitterUsername(screenName);
  //     //     }
  //     //   } catch (error: any) {}
  //     // };
  //     getTwitterAuthToken();
  //   }
  // }, [route.params]);

  let currentInstagramTokenExpiresAtReal =
    userProfile?.influencerProfile?.instagramTokenExpirationReal || 0;
  if (instagramTokenExpiresAtReal) {
    currentInstagramTokenExpiresAtReal = instagramTokenExpiresAtReal;
  }

  let currentTwitterTokenExpiresAtReal =
    userProfile?.influencerProfile?.twitterTokenExpirationReal || 0;
  if (twitterTokenExpiresAtReal) {
    currentTwitterTokenExpiresAtReal = twitterTokenExpiresAtReal;
  }

  const showInstagramWarning =
    userProfile?.influencerProfile?.instagramId && currentInstagramTokenExpiresAtReal < time;

  const showTwitterWarning =
    userProfile?.influencerProfile?.twitterId && currentTwitterTokenExpiresAtReal < time;

  const btnTextStyle = {
    paddingVertical: 7,
    fontSize: getFontSize(1.5),
    // fontFamily: 'OpenSans-Medium',
    letterSpacing: 1.25,
  };
  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <View style={styles.innerContainer}>
        <View style={{ paddingHorizontal: 25, paddingTop: 25 }}>
          {userProfile?.influencerProfile?.influencerStatus != 'approved' ? (
            <View style={{ backgroundColor: 'yellow', padding: 10, marginBottom: 10 }}>
              <Text style={{ color: '#000' }}>
                All changes made on this view needs to go through the account approval process
              </Text>
            </View>
          ) : null}
          <Text>Disclamer: Any changes on this form will trigger an approval process</Text>
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
                {/* {showInstagramWarning ? (
                  <Button
                    text="Reconnect Account"
                    mode="contained"
                    paper
                    btnTextStyle={btnTextStyle}
                    onPress={() => {
                      Linking.openURL(
                        `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_RECONNECT_REDIRECT}&scope=user_profile,user_media&response_type=code`
                      );
                    }}
                    disabled={userProfile?.influencerProfile?.influencerStatus != 'approved'}
                  />
                ) : (
                  <Button
                    text="Remove Account"
                    mode="contained"
                    buttonColor="red"
                    paper
                    btnTextStyle={btnTextStyle}
                    // btnStyle={{
                    //   ...GeneralStyle.btn,

                    //   backgroundColor: 'red',
                    //   borderRadius: 10,
                    //   // flex: 1,
                    //   marginHorizontal: 10,
                    //   padding: 10,
                    // }}
                    // btnTextStyle={{
                    //   marginHorizontal: 20,
                    //   color: 'white',
                    //   fontSize: 14,
                    // }}
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
                )} */}
              </>
            ) : (
              // <Button
              //   text="Connect Account"
              //   btnTextStyle={btnTextStyle}
              //   mode="contained"
              //   paper
              //   disabled={userProfile?.influencerProfile?.influencerStatus != 'approved'}
              //   onPress={() => {
              //     OpenURLButton(
              //       `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_CONNECT_REDIRECT}&scope=user_profile,user_media&response_type=code`,
              //       false,
              //       true,
              //       INSTAGRAM_CONNECT_REDIRECT
              //     );
              //   }}
              // />
              <View />
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 25 }}>
          <View style={{ flexDirection: 'row', marginTop: getHeight(5), marginBottom: 10 }}>
            <Ionicons name="logo-twitter" color="#032F3C" size={20} />
            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginLeft: 5,
                fontFamily: 'OpenSans-Regular',
              }}
            >
              Twitter Account
            </Text>
          </View>

          {showTwitterWarning ? (
            <View style={{ backgroundColor: '#E90202', padding: 10, marginBottom: 10 }}>
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
                {/* {showTwitterWarning ? (
                  <Button
                    text="Reconnect Account"
                    mode="contained"
                    paper
                    onPress={onTwitterButtonPress}
                    btnTextStyle={btnTextStyle}
                    disabled={userProfile?.influencerProfile?.influencerStatus != 'approved'}
                  />
                ) : (
                  <Button
                    text="Remove Account"
                    mode="contained"
                    buttonColor="red"
                    paper
                    btnTextStyle={btnTextStyle}
                    disabled={userProfile?.influencerProfile?.influencerStatus != 'approved'}
                    onPress={async () => {
                      dispatch(
                        removeSocialAccountRequest({
                          type: 'twitter',
                          token: userToken,
                        })
                      );
                    }}
                  />
                )} */}
              </>
            ) : (
              // <Button
              //   text="Connect Account"
              //   mode="contained"
              //   paper
              //   disabled={userProfile?.influencerProfile?.influencerStatus != 'approved'}
              //   btnStyle={{
              //     margin: 0,
              //   }}
              //   btnTextStyle={btnTextStyle}
              //   onPress={onTwitterButtonPress}
              // />
              <View />
            )}
          </View>
        </View>

        {/* <Text> This should trigger a new approval process if the account is changed</Text> */}
      </View>
    </View>
  );
}
export default InfluencerSettings;
