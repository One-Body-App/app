/* eslint-disable react/jsx-no-useless-fragment */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  Modal,
  TextInput as TextInputNative,
  useColorScheme,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import auth from '@react-native-firebase/auth';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

import Button from '@/components/Button';
import { styles } from './styles';
import { validateFields } from '@/utils/validation/validate-fields';
import validator from '@/utils/validation/validator';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '../../../constants/GeneralStyle';

import {
  OpenURLButton,
  TWITTER_CLIENT_ID,
  codeChallenge,
  getInstagramAuthToken,
  getTwitterAuthToken,
  INSTAGRAM_APP_ID,
  INSTAGRAM_LOGIN_REDIRECT,
} from '@/services/constants';
import Facebook from '@/assets/svg/Facebook.svg';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { SettingsStackParamsList } from '@/src/navigator/types';

const twitterRedirectUrl = 'onebodyapp://influencer/login/twitter';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerStepTwo'>;

function InfluencerStepTwo({ navigation, route }: Props) {
  const userToken = useSelector((state: RootState) => state.auth.userToken);
  const [twitterStateConfirmation] = useState(Math.random().toString(36).substring(2, 30));
  const [twitterCodeConfirmation, setTwitterCodeConfirmation] = useState<string>('');

  const inputRefs = {
    twitterUsername: useRef<TextInputNative>(null),
    instagramUsername: useRef<TextInputNative>(null),
    instagramHandler: useRef<TextInputNative>(null),
    twitterTitle: useRef<TextInputNative>(null),
    instagramTitle: useRef<TextInputNative>(null),
    comments: useRef<TextInputNative>(null),
    bio: useRef<TextInputNative>(null),
    title: useRef<TextInputNative>(null),
    website: useRef<TextInputNative>(null),
    rssFeed1: useRef<TextInputNative>(null),
    rssFeed2: useRef<TextInputNative>(null),
  };
  const [state, setState] = useState({
    twitterUsername: '',
    twitterUsernameError: '',
    twitterId: '',
    twitterIdError: '',
    twitterToken: '',
    twitterTokenExpiresAtReal: '',
    twitterTokenExpiresAt: '',

    instagramUsername: '',
    instagramUsernameError: '',
    instagramId: '',
    instagramToken: '',
    twitterRefreshToken: '',
    instagramTokenExpiresAtReal: '',
    instagramTokenExpiresAt: '',
    instagramIdError: '',
    comments: '',
    commentsError: '',
    bio: '',
    bioError: '',
    title: '',
    titleError: '',
    website: '',
    websiteError: '',
    rssFeed1: '',
    rssFeed1Category: 'news',
    rssFeed1Error: '',
    rssFeed2: '',
    rssFeed2Category: 'news',
    rssFeed2Error: '',
  });

  useEffect(() => {
    if (route.params?.action == 'instagram' && route.params?.code) {
      getInstagramAuthToken(route.params?.code, userToken, INSTAGRAM_LOGIN_REDIRECT).then(
        (result) => {
          setState({
            ...state,
            ...result,
          });
        }
      );
    }

    if (
      route.params?.action == 'twitter' &&
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
        setState({
          ...state,
          ...result,
        });
      });
    }
  }, [route.params]);

  const onNext = async () => {
    const { twitterId, instagramId, bio } = state;
    const twitterIdError = await validator('twitterId', twitterId);
    const instagramIdError = await validator('instagramId', instagramId);
    const bioError = await validator('bio', bio);

    if (!bioError) {
      setModalVisible(true);
      // navigation.navigate('InfluencerStepThree',{data:{twitterUsername, instagramUsername,twitterHandler,instagramHandler,twitterTitle,instagramTitle,comments}})
    } else {
      setState({
        ...state,
        twitterIdError,
        instagramIdError,
        bioError,
      });
    }
  };
  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const [modalVisible, setModalVisible] = useState(false);

  const { dark, colors } = useTheme();
  const [error, seterror] = useState<string>();
  const [isLoggedInFacebook, setIsLoggedInFacebook] = useState<boolean>(false);
  const [isLoggedInTwitter, setIsLoggedInTwitter] = useState<boolean>(false);

  const facebookLogin = async () => {
    try {
      seterror('');
      dispatch(setLoader(true));

      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('User cancelled the login process');
      }

      // Once signed in, get the users AccesToken
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw new Error('Something went wrong obtaining access token');
      }

      let foundFacebook = false;

      auth().currentUser?.providerData.forEach((provider) => {
        if (provider.providerId == 'facebook.com') {
          foundFacebook = true;
        }
      });

      if (!foundFacebook) {
        const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);

        // await auth().currentUser?.linkWithCredential(facebookCredential);
      }

      setIsLoggedInFacebook(true);
      dispatch(setLoader(false));
    } catch (error: any) {
      if (error.message) seterror(error.message.replace(`[${error.code}]`, ''));
    }
  };

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

  const scheme = useColorScheme();

  const getButtonTextStyle = () => {
    return { ...styles.btnTitle, color: scheme == 'dark' ? '#838383' : '#032F3C' };
  };

  const getButtonContainer = () => {
    return { ...styles.buttonContainer, borderColor: colors.border };
  };

  const getDisabledButtonTextStyle = () => {
    return {
      ...styles.disabledBtnTextStyle,
      color: scheme == 'dark' ? '#3a3a3a' : '#B3C1C5',
      borderColor: colors.border,
    };
  };

  const getDisabledButtonStyle = () => {
    return { ...styles.disabledButtonContainer, borderColor: colors.border };
  };

  const dispatch = useDispatch();

  useEffect(() => {
    auth()
      .currentUser?.getIdTokenResult()
      .then((result) => {
        if (result.signInProvider == 'facebook.com') {
          setIsLoggedInFacebook(true);
        }

        if (result.signInProvider == 'twitter.com') {
          setIsLoggedInTwitter(true);
        }
      });

    codeChallenge().then((code) => {
      setTwitterCodeConfirmation(code);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons
              name="close"
              color="#B3C1C5"
              style={{ alignSelf: 'flex-end' }}
              onPress={() => setModalVisible(false)}
              size={getFontSize(3)}
            />
            <Text
              style={{
                ...styles.heading,
                color: '#032F3C',
                marginTop: 6,
                fontWeight: '500',
              }}
            >
              Confirm details
            </Text>
            <View style={{ marginTop: 0, marginLeft: 15, height: getHeight(65) }}>
              {state.twitterUsername ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),

                      marginVertical: 10,
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    <Ionicons name="logo-twitter" color="#032F3C" size={20} /> Twitter handle
                  </Text>

                  <Text
                    style={{
                      marginTop: 15,
                      color: '#032F3C',
                      fontWeight: '400',
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    {state.twitterUsername}
                  </Text>
                </>
              ) : null}

              {state.instagramUsername ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),
                      marginTop: getHeight(5),
                      marginBottom: 10,
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    <Ionicons name="logo-instagram" color="#032F3C" size={20} /> Instagram handle
                  </Text>
                  <Text
                    style={{
                      marginTop: 20,
                      color: '#032F3C',
                      fontWeight: '400',
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    {state.instagramUsername}
                  </Text>
                </>
              ) : null}

              {state.rssFeed1 ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),
                      marginTop: getHeight(5),
                      marginBottom: 10,
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    RSS
                  </Text>
                  {state.rssFeed1 ? (
                    <Text
                      style={{
                        marginTop: 20,
                        color: '#032F3C',
                        fontWeight: '400',
                        fontFamily: 'Rubik-Regular',
                      }}
                    >
                      {state.rssFeed1Category} - {state.rssFeed1}
                    </Text>
                  ) : null}

                  {state.rssFeed2 ? (
                    <Text
                      style={{
                        marginTop: 20,
                        color: '#032F3C',
                        fontWeight: '400',
                        fontFamily: 'Rubik-Regular',
                      }}
                    >
                      {state.rssFeed2Category} - {state.rssFeed2}
                    </Text>
                  ) : null}
                </>
              ) : null}

              {/* <Text
                style={{
                  marginTop: 15,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.instagramTitle}
              </Text> */}

              <Text
                style={{
                  color: '#4f6d77',
                  fontWeight: '700',
                  fontSize: getFontSize(2.3),
                  marginTop: getHeight(5),
                  marginBottom: 10,
                  fontFamily: 'Rubik-Regular',
                }}
              >
                Bio
              </Text>
              <Text
                style={{
                  marginTop: 20,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.bio}
              </Text>

              {state.comments ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),
                      marginTop: getHeight(5),
                      marginBottom: 10,
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    Comments
                  </Text>
                  <Text
                    style={{
                      marginTop: 20,
                      color: '#032F3C',
                      fontWeight: '400',
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    {state.comments}
                  </Text>
                </>
              ) : null}
            </View>
            <Button
              text="DONE"
              btnStyle={{ backgroundColor: '#032F3C' }}
              onPress={() => {
                setModalVisible(false);
                const {
                  twitterUsername,
                  twitterToken,
                  twitterId,
                  twitterTokenExpiresAt,
                  twitterTokenExpiresAtReal,

                  instagramUsername,
                  instagramId,
                  instagramToken,
                  twitterRefreshToken,
                  instagramTokenExpiresAt,
                  instagramTokenExpiresAtReal,
                  bio,

                  comments,
                  website,
                  rssFeed1,
                  rssFeed1Category,

                  rssFeed2,
                  rssFeed2Category,
                } = state;
                navigation.navigate('InfluencerStepThree', {
                  data: {
                    twitterUsername,
                    twitterToken,
                    twitterRefreshToken,
                    twitterId,
                    twitterTokenExpiresAt,
                    twitterTokenExpiresAtReal,

                    instagramUsername,
                    instagramToken,
                    instagramId,
                    instagramTokenExpiresAt,
                    instagramTokenExpiresAtReal,

                    bio,
                    comments,
                    website,
                    rssFeed1,
                    rssFeed1Category,

                    rssFeed2,
                    rssFeed2Category,
                  },
                });
              }}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text
                style={{
                  color: '#70747D',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  alignItems: 'center',
                  marginTop: getHeight(2),
                }}
              >
                Edit details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.innerContainer}>
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formstepview}>
            <Logo
              height={getHeight(14)}
              width={getWidth(40)}
              style={{ margin: getHeight(4), alignSelf: 'center' }}
            />

            <Text style={{ ...styles.text, color: '#4F6D77' }}>Step 2 of 3</Text>
            <Text
              style={{
                ...styles.heading,
                color: dark ? colors.text : '#032F3C',
                marginVertical: 12,
                fontFamily: 'Rubik-Medium',
              }}
            >
              Application
            </Text>
          </View>

          <TextInput
            keyboardType="url"
            style={{ ...GeneralStyle.input, backgroundColor: colors.background }}
            ref={inputRefs.website}
            value={state.website}
            returnKeyType="next"
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor="#9EA1A2"
            theme={{
              roundness: 10,
              dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            label="Website"
            onFocus={() => setState({ ...state, websiteError: '' })}
            onBlur={() =>
              validateFields(state.website, 'website', (error) =>
                setState({ ...state, websiteError: error })
              )
            }
            onSubmitEditing={() => inputRefs.twitterUsername.current?.focus()}
            onChangeText={(website) => changeHandler('website', website.trim())}
            blurOnSubmit={false}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={GeneralStyle.InputError}>{state.websiteError}</Text>
          <Text style={{ color: '#4F6D77', fontSize: 17, fontWeight: '500', marginTop: 10 }}>
            Bio
          </Text>

          <TextInput
            style={{
              ...GeneralStyle.input,
              backgroundColor: colors.background,
              height: getHeight(12),
            }}
            ref={inputRefs.bio}
            multiline
            numberOfLines={5}
            value={state.bio}
            returnKeyType="next"
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor="#9EA1A2"
            theme={{
              roundness: 10,
              dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            onFocus={() => setState({ ...state, bioError: '' })}
            onBlur={() =>
              validateFields(state.bio, 'bio', (error) => setState({ ...state, bioError: error }))
            }
            onSubmitEditing={() => onNext()}
            onChangeText={(bio) => changeHandler('bio', bio)}
            blurOnSubmit={false}
          />
          <Text style={GeneralStyle.InputError}>{state.bioError}</Text>
          <Text style={{ color: '#4F6D77', fontSize: 17, fontWeight: '500' }}>Comments</Text>

          <TextInput
            style={{
              ...GeneralStyle.input,
              backgroundColor: colors.background,
              height: getHeight(12),
            }}
            ref={inputRefs.comments}
            multiline
            numberOfLines={5}
            value={state.comments}
            returnKeyType="done"
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor="#9EA1A2"
            theme={{
              roundness: 10,
              dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            onFocus={() => setState({ ...state, commentsError: '' })}
            onBlur={() =>
              validateFields(state.comments, 'comments', (error) =>
                setState({ ...state, commentsError: error })
              )
            }
            onSubmitEditing={() => onNext()}
            onChangeText={(comments) => changeHandler('comments', comments)}
            blurOnSubmit={false}
          />
          <Text style={GeneralStyle.InputError}>{state.commentsError}</Text>
          <View style={{ justifyContent: 'flex-start', marginTop: getHeight(3) }}>
            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),

                marginBottom: 10,
                fontFamily: 'Rubik-Regular',
              }}
            >
              <Ionicons name="logo-twitter" size={20} /> Twitter
            </Text>

            {state.twitterUsername ? (
              <Text>Logged in as @{state.twitterUsername}</Text>
            ) : (
              <Button
                text={isLoggedInTwitter ? 'Link Twitter Account' : 'Login with Twitter'}
                btnStyle={getButtonContainer()}
                btnTextStyle={getButtonTextStyle()}
                onPress={() => {
                  onTwitterButtonPress();
                }}
                disabledBtnStyle={getDisabledButtonStyle()}
                disabledBtnTextStyle={getDisabledButtonTextStyle()}
                wrapperBtnStyle={{
                  width: '100%',

                  paddingVertical: 10,
                }}
              />
            )}

            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginTop: getHeight(3),
                marginBottom: 10,
                fontFamily: 'Rubik-Regular',
              }}
            >
              <Ionicons name="logo-instagram" size={15} color="#032F3C" /> Instagram
            </Text>
            {state.instagramUsername ? (
              <Text>Logged in as @{state.instagramUsername}</Text>
            ) : (
              <>
                {isLoggedInFacebook ? (
                  <Button
                    text="Link Instagram Account"
                    btnStyle={getButtonContainer()}
                    btnTextStyle={getButtonTextStyle()}
                    onPress={() => {
                      OpenURLButton(
                        `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_LOGIN_REDIRECT}&scope=user_profile,user_media&response_type=code`,
                        false,
                        true,
                        INSTAGRAM_LOGIN_REDIRECT
                      );
                    }}
                    disabledBtnStyle={getDisabledButtonStyle()}
                    disabledBtnTextStyle={getDisabledButtonTextStyle()}
                    wrapperBtnStyle={{
                      width: '100%',

                      paddingVertical: 10,
                    }}
                  />
                ) : (
                  <Button
                    text="Login with Facebook"
                    leftIcon={
                      <Facebook style={{ marginLeft: 5, marginRight: 10 }} fill="#1877f2" />
                    }
                    btnStyle={getButtonContainer()}
                    btnTextStyle={getButtonTextStyle()}
                    onPress={() => {
                      facebookLogin();
                    }}
                    disabledBtnStyle={getDisabledButtonStyle()}
                    disabledBtnTextStyle={getDisabledButtonTextStyle()}
                    wrapperBtnStyle={{
                      width: '100%',

                      paddingVertical: 10,
                    }}
                  />
                )}
              </>
            )}

            {/* <TextInput
              style={GeneralStyle.input}
              ref={inputRefs.instagramUsername}
              value={state.instagramUsername}
              returnKeyType={'next'}
              theme={{ roundness: 10 }}
              mode="outlined"
              activeOutlinecolor={Colors.primarySapphire[500]}
              outlineColor={'#9EA1A2'}
              label={'@Username'}
              onFocus={() => setState({ ...state, instagramUsernameError: '' })}
              onBlur={() =>
                validateFields(state.instagramUsername, 'instagramUsername', (error) =>
                  setState({ ...state, instagramUsernameError: error })
                )
              }
              onSubmitEditing={() => inputRefs.instagramHandler.current?.focus()}
              onChangeText={(instagramUsername) =>
                changeHandler('instagramUsername', instagramUsername.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.instagramUsernameError}</Text>
            <TextInput
              style={GeneralStyle.input}
              ref={inputRefs.instagramHandler}
              value={state.instagramHandler}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlinecolor={Colors.primarySapphire[500]}
              theme={{ roundness: 10 }}
              outlineColor={'#9EA1A2'}
              label={'Twitter link'}
              onFocus={() => setState({ ...state, instagramHandlerError: '' })}
              onBlur={() =>
                validateFields(state.instagramHandler, 'instagramHandler', (error) =>
                  setState({ ...state, instagramHandlerError: error })
                )
              }
              onSubmitEditing={() => inputRefs.instagramTitle.current?.focus()}
              onChangeText={(instagramHandler) =>
                changeHandler('instagramHandler', instagramHandler.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.instagramHandlerError}</Text>

            <TextInput
              style={GeneralStyle.input}
              ref={inputRefs.instagramTitle}
              value={state.instagramTitle}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlinecolor={Colors.primarySapphire[500]}
              theme={{ roundness: 10 }}
              outlineColor={'#9EA1A2'}
              label={'Title/Description'}
              onFocus={() => setState({ ...state, instagramTitleError: '' })}
              onBlur={() =>
                validateFields(state.instagramTitle, 'instagramTitle', (error) =>
                  setState({ ...state, instagramTitleError: error })
                )
              }
              onSubmitEditing={() => inputRefs.comments.current?.focus()}
              onChangeText={(instagramTitle) =>
                changeHandler('instagramTitle', instagramTitle.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.instagramTitleError}</Text>
            <Text style={styles.twetertext}>Add instagram handle</Text> */}
            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginTop: getHeight(3),
                marginBottom: 10,
                fontFamily: 'Rubik-Regular',
              }}
            >
              RSS
            </Text>

            <>
              <TextInput
                style={{
                  ...GeneralStyle.input,
                  backgroundColor: colors.background,
                }}
                ref={inputRefs.rssFeed1}
                value={state.rssFeed1}
                returnKeyType="next"
                mode="outlined"
                activeOutlineColor={colors.primary}
                outlineColor="#9EA1A2"
                theme={{
                  roundness: 10,
                  dark,
                  colors: { text: colors.text, placeholder: colors.primary },
                }}
                label="URL"
                onFocus={() => setState({ ...state, rssFeed1Error: '' })}
                onSubmitEditing={() => inputRefs.rssFeed1.current?.focus()}
                onChangeText={(rssFeed1) => changeHandler('rssFeed1', rssFeed1.trim())}
                blurOnSubmit={false}
              />
              <Text style={GeneralStyle.InputError}>{state.rssFeed1Error}</Text>

              <Picker
                selectedValue={state.rssFeed1Category}
                onValueChange={(itemValue, itemIndex) => {
                  setState({ ...state, rssFeed1Category: itemValue });
                }}
              >
                <Picker.Item label="News" value="news" />
                <Picker.Item label="Blog" value="blog" />
              </Picker>
            </>

            {state.rssFeed1 ? (
              <>
                <TextInput
                  style={{
                    ...GeneralStyle.input,
                    backgroundColor: colors.background,
                  }}
                  ref={inputRefs.rssFeed2}
                  value={state.rssFeed2}
                  returnKeyType="next"
                  mode="outlined"
                  activeOutlineColor={colors.primary}
                  outlineColor="#9EA1A2"
                  theme={{
                    roundness: 10,
                    dark,
                    colors: { text: colors.text, placeholder: colors.primary },
                  }}
                  label="URL"
                  onFocus={() => setState({ ...state, rssFeed2Error: '' })}
                  onSubmitEditing={() => inputRefs.rssFeed2.current?.focus()}
                  onChangeText={(rssFeed2) => changeHandler('rssFeed2', rssFeed2.trim())}
                  blurOnSubmit={false}
                />
                <Text style={GeneralStyle.InputError}>{state.rssFeed2Error}</Text>
                <Picker
                  selectedValue={state.rssFeed2Category}
                  onValueChange={(itemValue, itemIndex) =>
                    setState({ ...state, rssFeed2Category: itemValue })
                  }
                >
                  <Picker.Item label="News" value="blog" />
                  <Picker.Item label="Blog" value="news" />
                </Picker>
              </>
            ) : null}
          </View>
          <View style={{ height: getHeight(10) }} />
        </KeyboardAwareScrollView>
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.wavebgimage}
          // eslint-disable-next-line global-require
          source={require('@/assets/images/waveBG.png')}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={getFontSize(3)} />
            <Text style={styles.footerText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>

          <TouchableOpacity
            onPress={() => onNext()}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={styles.footerText}>Next</Text>
            <Ionicons name="chevron-forward" size={getFontSize(3)} />
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </View>
  );
}
export default InfluencerStepTwo;
